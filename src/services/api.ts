import { invoke } from '@tauri-apps/api/tauri'

// Product commands
export const loadProductsFromCSV = (filePath: string) =>
  invoke('load_products_from_csv', { filePath })

export const getProductsByReference = (references: string[]) =>
  invoke('get_products_by_reference', { references })

// Image commands
export const findCandidateImages = (productReference: string) =>
  invoke('find_candidate_images', { productReference })

export const uploadImage = (productReference: string, imagePath: string) =>
  invoke('upload_image', { productReference, imagePath })

// Review commands
export const saveReview = (review: any) => invoke('save_review', { review })

export const getReviewSession = (sessionId: string) =>
  invoke('get_review_session', { sessionId })

// Report commands
export const generatePDFReport = (sessionId: string, outputPath: string) =>
  invoke('generate_pdf_report', { sessionId, outputPath })

export const generateCSVReport = (sessionId: string, outputPath: string) =>
  invoke('generate_csv_report', { sessionId, outputPath })

// Settings commands
export const getSettings = () => invoke('get_settings')

export const updateSettings = (settings: any) =>
  invoke('update_settings', { settings })
