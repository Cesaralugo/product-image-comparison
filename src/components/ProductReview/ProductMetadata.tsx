import type { Product } from '@/types'
import './ProductMetadata.css'

interface ProductMetadataProps {
  product: Product
}

const ProductMetadata: React.FC<ProductMetadataProps> = ({ product }) => {
  return (
    <div className="product-metadata">
      <div className="metadata-section">
        <h2>Product Information</h2>
        <div className="metadata-item">
          <label>Reference:</label>
          <span className="reference-value">{product.reference}</span>
        </div>
        <div className="metadata-item">
          <label>Description:</label>
          <span className="description-value">{product.description}</span>
        </div>
        {product.metadata && Object.keys(product.metadata).length > 0 && (
          <div className="metadata-item">
            <label>Additional Info:</label>
            <div className="metadata-table">
              {Object.entries(product.metadata).map(([key, value]) => (
                <div key={key} className="metadata-row">
                  <span className="metadata-key">{key}:</span>
                  <span className="metadata-value">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductMetadata
