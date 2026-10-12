import mongoose from 'mongoose';

const RollSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true },
  initialMeters: { type: Number, required: true, default: 0 },
  currentMeters: { type: Number, required: true, default: 0 },
  batchNo: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Depleted'], default: 'Active' },
  addedAt: { type: Date, default: Date.now },
});

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    section: {
      type: String,
      enum: ['Women', 'Kids Girls', 'Kids Boys', 'Infants', 'Ethnic Material', 'Accessories'],
      default: 'Women',
    },
    category: {
      type: String,
      required: true,
      default: 'Kurtis & Suits',
    },
    size: {
      type: String,
      default: 'Free Size', // e.g., 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2-3Y', '4-5Y', '6-7Y', '0-6M'
    },
    color: { type: String, default: 'Multicolor' },
    fabric: { type: String, default: 'Cotton' },
    brand: { type: String, default: 'Boutique Collection' },
    unit: { type: String, enum: ['piece', 'set', 'meter'], default: 'piece' },
    mrp: { type: Number, default: 0 },
    costPrice: { type: Number, required: true, default: 0 },
    sellingPrice: { type: Number, required: true, default: 0 },
    gstRate: { type: Number, default: 0 },
    hsnCode: { type: String, default: '6204' }, // 6204 women suits/dresses, 6209 babies garments
    minStockAlert: { type: Number, default: 5 },
    currentStock: { type: Number, default: 0 },
    barcode: { type: String, default: '' },
    rolls: [RollSchema], // Optional support for unstitched dress materials/rolls
    totalSoldQuantity: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-calculate currentStock if rolls are present (for unstitched materials)
ProductSchema.pre('save', function () {
  if (this.rolls && this.rolls.length > 0) {
    this.currentStock = this.rolls.reduce((sum, r) => sum + (r.currentMeters > 0 ? r.currentMeters : 0), 0);
  }
});

if (mongoose.models.Product) {
  delete mongoose.models.Product;
}
export default mongoose.model('Product', ProductSchema);
