
import { Plus, Heart, ArrowUpRight } from "lucide-react";

export default function ProductCard({
  product,
  onAdd,
  onView,
  isWishlisted,
  onToggleWishlist,
}) {
  const formattedPrice = product.price.toLocaleString("en-IN");

  return (
    <article className="product-card">
      {/* Product image */}
      <div className={`product-image-wrap product-tone-${product.tone}`}>
        <span className="product-index">
          SF / {String(product.id).padStart(3, "0")}
        </span>

        <span className="product-image-label">
          {product.id === 1 ? "BESTSELLER" : product.tag}
        </span>

        {/* Wishlist */}
        <button
          type="button"
          className={`wishlist-product ${
            isWishlisted ? "is-saved" : ""
          }`}
          onClick={() => onToggleWishlist(product.id)}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={isWishlisted}
        >
          <Heart
            size={18}
            strokeWidth={1.7}
            fill={isWishlisted ? "currentColor" : "none"}
          />
        </button>

        {/* Clickable product photography */}
        <button
          type="button"
          className="product-image"
          onClick={() => onView(product)}
          aria-label={`View ${product.name} details`}
        >
          <img
            src={product.image}
            alt={product.alt}
            loading="lazy"
          />

          <span className="quick-view-label">
            <span>DISCOVER THE DETAILS</span>
            <ArrowUpRight size={16} />
          </span>
        </button>

        <span className="product-image-bottom">
          EVERYDAY ICONS / 2026
        </span>
      </div>

      {/* Product information */}
      <div className="product-meta">
        <div className="product-copy">
          <p className="product-tag">{product.tag}</p>

          <button
            type="button"
            className="product-title-button"
            onClick={() => onView(product)}
          >
            <h3>{product.name}</h3>
          </button>

          <p className="product-price">
            ₹{formattedPrice}
          </p>
        </div>

        {/* Opens product details so the shopper can select a size */}
        <button
          type="button"
          className="add-button"
          onClick={() => onView(product)}
          aria-label={`Choose size for ${product.name}`}
          title="Choose your size"
        >
          <Plus size={19} strokeWidth={1.7} />
        </button>
      </div>
    </article>
  );
}
