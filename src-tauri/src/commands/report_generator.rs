// src/commands/report_generator.rs
use crate::models::review::{ReviewResult, ReviewSession};
use crate::services::database::Database;
use crate::config;  // For APP_VERSION
use printpdf::*;
use serde_json::json;
use std::fs::File;
use std::io::BufWriter;
use std::sync::Mutex;
use tauri::State;
use rusqlite::Connection;

// Database connection state - matching what's in main.rs
pub struct DbState {
    pub conn: Mutex<Connection>,
}

#[derive(Debug, Clone)]
struct ReportData {
    session: ReviewSession,
    reviews: Vec<ReviewResult>,
    generated_at: String,
}

#[tauri::command]
pub async fn generate_pdf_report(
    session_id: String,
    output_path: String,
    state: State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    if session_id.is_empty() {
        return Err("Session ID is required".to_string());
    }

    // Get database connection
    let conn = state.conn.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    // Load session data
    let report_data = load_report_data(&conn, &session_id)?;

    // Generate PDF
    let pdf_path = generate_pdf(&report_data, &output_path)?;

    Ok(json!({
        "status": "success",
        "message": "PDF report generated successfully",
        "output_path": pdf_path,
        "session_id": session_id
    }))
}

#[tauri::command]
pub async fn generate_csv_report(
    session_id: String,
    output_path: String,
    state: State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    if session_id.is_empty() {
        return Err("Session ID is required".to_string());
    }

    // Get database connection
    let conn = state.conn.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    // Load session data
    let report_data = load_report_data(&conn, &session_id)?;

    // Generate CSV
    let csv_path = generate_csv(&report_data, &output_path)?;

    Ok(json!({
        "status": "success",
        "message": "CSV report generated successfully",
        "output_path": csv_path,
        "session_id": session_id
    }))
}

#[tauri::command]
pub async fn preview_report(
    session_id: String,
    state: State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    if session_id.is_empty() {
        return Err("Session ID is required".to_string());
    }

    let conn = state.conn.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let report_data = load_report_data(&conn, &session_id)?;

    // Format for preview
    let preview = format_report_for_preview(&report_data);

    Ok(json!({
        "status": "success",
        "preview": preview
    }))
}

/// Load all report data for a session
fn load_report_data(conn: &Connection, session_id: &str) -> Result<ReportData, String> {
    let session = Database::get_review_session(conn, session_id)?
        .ok_or_else(|| format!("Session not found: {}", session_id))?;

    let reviews = Database::get_session_reviews(conn, session_id)?;

    Ok(ReportData {
        session,
        reviews,
        generated_at: chrono::Utc::now().to_rfc3339(),
    })
}

/// Generate PDF report
fn generate_pdf(data: &ReportData, output_path: &str) -> Result<String, String> {
    // Create PDF document
    let (doc, page1, layer1) = PdfDocument::new(
        format!("Product Review Report - {}", data.session.id),
        Mm(210.0),
        Mm(297.0),
        "Layer 1",
    );

    let current_layer = doc.get_page(page1).get_layer(layer1);

    // Set up fonts
    let font = doc.add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|e| format!("Failed to add font: {}", e))?;

    // Get current date for header
    let now = chrono::Local::now();
    let date_str = now.format("%B %d, %Y at %H:%M").to_string();

    // ============ HEADER ============
    // Title
    current_layer.use_text(
        "Product Image Review Report".to_string(),
        24.0,
        Mm(20.0),
        Mm(270.0),
        &font,
    );

    // Subtitle
    current_layer.use_text(
        format!("Session ID: {}", data.session.id),
        12.0,
        Mm(20.0),
        Mm(255.0),
        &font,
    );

    // Date
    current_layer.use_text(
        format!("Generated: {}", date_str),
        10.0,
        Mm(20.0),
        Mm(240.0),
        &font,
    );

    // ============ SESSION SUMMARY ============
    let mut y_pos = 220.0;

    current_layer.use_text(
        "Session Summary".to_string(),
        16.0,
        Mm(20.0),
        Mm(y_pos),
        &font,
    );
    y_pos -= 15.0;

    let completion = if data.session.product_count > 0 {
        (data.session.reviewed_count as f64 / data.session.product_count as f64) * 100.0
    } else {
        0.0
    };

    let summary_text = format!(
        "Started: {}\nStatus: {}\nTotal Products: {}\nReviewed: {}\nCompletion: {:.1}%",
        data.session.started_at,
        data.session.status,
        data.session.product_count,
        data.session.reviewed_count,
        completion
    );

    for line in summary_text.lines() {
        current_layer.use_text(
            line.to_string(),
            10.0,
            Mm(25.0),
            Mm(y_pos),
            &font,
        );
        y_pos -= 12.0;
    }

    y_pos -= 10.0;

    // ============ REVIEW DETAILS ============
    current_layer.use_text(
        "Review Details".to_string(),
        16.0,
        Mm(20.0),
        Mm(y_pos),
        &font,
    );
    y_pos -= 15.0;

    // Table headers
    let headers = vec![
        "Product Reference",
        "Candidates",
        "Selected",
        "Uploaded",
        "Notes",
        "Time (s)",
        "Decision Time",
    ];

    y_pos -= 10.0;

    // Column widths
    let col_widths = vec![35.0, 18.0, 18.0, 18.0, 35.0, 22.0, 30.0];
    let mut x_pos = 20.0;

    for (i, header) in headers.iter().enumerate() {
        current_layer.use_text(
            header.to_string(),
            8.0,
            Mm(x_pos),
            Mm(y_pos),
            &font,
        );
        x_pos += col_widths[i];
    }
    y_pos -= 10.0;

    // Table rows
    for review in &data.reviews {
        if y_pos < 20.0 {
            break;
        }

        let notes = if review.reviewer_notes.len() > 25 {
            format!("{}...", &review.reviewer_notes[0..25])
        } else {
            review.reviewer_notes.clone()
        };

        let row_data = vec![
            review.product_reference.clone(),
            review.candidates_presented.len().to_string(),
            review.selected_images.len().to_string(),
            review.uploaded_replacements.len().to_string(),
            notes,
            format!("{:.1}", review.time_to_decide as f64 / 1000.0),
            review.decision_timestamp.clone(),
        ];

        let mut x_pos = 20.0;
        for (i, text) in row_data.iter().enumerate() {
            let font_size = if i == 4 { 7.0 } else { 8.0 };
            current_layer.use_text(
                text.clone(),
                font_size,
                Mm(x_pos),
                Mm(y_pos),
                &font,
            );
            x_pos += col_widths[i];
        }
        y_pos -= 10.0;
    }

    // ============ FOOTER ============
    current_layer.use_text(
        format!("Generated by Product Image Review Platform v{}", config::APP_VERSION),
        8.0,
        Mm(20.0),
        Mm(10.0),
        &font,
    );

    // Save PDF
    let final_path = if output_path.is_empty() {
        let default_name = format!("review_report_{}.pdf", data.session.id);
        std::env::current_dir()
            .map_err(|e| format!("Failed to get current directory: {}", e))?
            .join(default_name)
            .to_string_lossy()
            .to_string()
    } else {
        output_path.to_string()
    };

    let file = File::create(&final_path)
        .map_err(|e| format!("Failed to create PDF file: {}", e))?;
    let mut writer = BufWriter::new(file);
    doc.save(&mut writer)
        .map_err(|e| format!("Failed to save PDF: {}", e))?;

    Ok(final_path)
}

/// Generate CSV report
fn generate_csv(data: &ReportData, output_path: &str) -> Result<String, String> {
    use csv::Writer;

    let final_path = if output_path.is_empty() {
        let default_name = format!("review_report_{}.csv", data.session.id);
        std::env::current_dir()
            .map_err(|e| format!("Failed to get current directory: {}", e))?
            .join(default_name)
            .to_string_lossy()
            .to_string()
    } else {
        output_path.to_string()
    };

    let file = File::create(&final_path)
        .map_err(|e| format!("Failed to create CSV file: {}", e))?;

    let mut writer = Writer::from_writer(file);

    // Write session summary as header comments
    writer.write_record(&["# Product Image Review Report"])
        .map_err(|e| format!("Failed to write CSV header: {}", e))?;
    writer.write_record(&[format!("# Session ID: {}", data.session.id)])
        .map_err(|e| format!("Failed to write CSV session: {}", e))?;
    writer.write_record(&[format!("# Generated: {}", data.session.started_at)])
        .map_err(|e| format!("Failed to write CSV generated: {}", e))?;
    writer.write_record(&[format!("# Status: {}", data.session.status)])
        .map_err(|e| format!("Failed to write CSV status: {}", e))?;
    writer.write_record(&[format!("# Total Products: {}", data.session.product_count)])
        .map_err(|e| format!("Failed to write CSV product count: {}", e))?;
    writer.write_record(&[format!("# Reviewed: {}", data.session.reviewed_count)])
        .map_err(|e| format!("Failed to write CSV reviewed count: {}", e))?;
    writer.write_record(Vec::<&str>::new())
        .map_err(|e| format!("Failed to write CSV empty line: {}", e))?;

    // Write headers
    writer.write_record(&[
        "Product Reference",
        "Candidates Count",
        "Selected Images",
        "Uploaded Replacements",
        "Reviewer Notes",
        "Time to Decide (s)",
        "Decision Timestamp",
    ]).map_err(|e| format!("Failed to write CSV headers: {}", e))?;

    // Write data rows
    for review in &data.reviews {
        writer.write_record(&[
            &review.product_reference,
            &review.candidates_presented.len().to_string(),
            &review.selected_images.join("; "),
            &review.uploaded_replacements.join("; "),
            &review.reviewer_notes,
            &format!("{:.2}", review.time_to_decide as f64 / 1000.0),
            &review.decision_timestamp,
        ]).map_err(|e| format!("Failed to write CSV row for {}: {}", review.product_reference, e))?;
    }

    writer.flush()
        .map_err(|e| format!("Failed to flush CSV: {}", e))?;

    Ok(final_path)
}

/// Format report data for frontend preview
fn format_report_for_preview(data: &ReportData) -> serde_json::Value {
    let completion_percentage = if data.session.product_count > 0 {
        (data.session.reviewed_count as f64 / data.session.product_count as f64) * 100.0
    } else {
        0.0
    };

    let reviews_preview: Vec<serde_json::Value> = data.reviews.iter().map(|r| {
        json!({
            "review_id": r.id,
            "product_reference": r.product_reference,
            "candidates_count": r.candidates_presented.len(),
            "selected_count": r.selected_images.len(),
            "uploaded_count": r.uploaded_replacements.len(),
            "notes": r.reviewer_notes,
            "time_to_decide_seconds": r.time_to_decide as f64 / 1000.0,
            "decision_timestamp": r.decision_timestamp
        })
    }).collect();

    json!({
        "session": {
            "id": data.session.id,
            "started_at": data.session.started_at,
            "last_updated": data.session.last_updated,
            "product_count": data.session.product_count,
            "reviewed_count": data.session.reviewed_count,
            "status": data.session.status,
            "completion_percentage": completion_percentage
        },
        "reviews": reviews_preview,
        "summary": {
            "total_reviews": data.reviews.len(),
            "total_candidates_presented": data.reviews.iter().map(|r| r.candidates_presented.len()).sum::<usize>(),
            "total_selected_images": data.reviews.iter().map(|r| r.selected_images.len()).sum::<usize>(),
            "total_uploaded_replacements": data.reviews.iter().map(|r| r.uploaded_replacements.len()).sum::<usize>(),
            "average_time_to_decide_ms": if data.reviews.is_empty() {
                0.0
            } else {
                data.reviews.iter().map(|r| r.time_to_decide).sum::<u64>() as f64 / data.reviews.len() as f64
            }
        },
        "generated_at": data.generated_at
    })
}
