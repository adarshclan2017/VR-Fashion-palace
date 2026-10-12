import mongoose from 'mongoose';

const SaleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  code: { type: String, required: true },
  section: { type: String, default: 'Women' },
  category: { type: String, default: 'Kurtis & Suits' },
  size: { type: String, default: '' },
  color: { type: String, default: '' },
  rollNumber: { type: String, default: '' },
  quantity: { type: Number, required: true }, // pieces, sets, or meters
  unit: { type: String, default: 'piece' },
  rate: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxableAmount: { type: Number, required: true },
  gstRate: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  total: { type: Number, required: true },
});

const SaleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, uppercase: true },
    customer: {
      name: { type: String, default: 'Cash Customer' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      gstin: { type: String, default: '' },
    },
    items: [SaleItemSchema],
    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Credit/Due'],
      default: 'Cash',
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Partial'],
      default: 'Paid',
    },
    notes: { type: String, default: '' },
    createdBy: {
      userId:      { type: String, default: '' },
      username:    { type: String, default: '' },
      displayName: { type: String, default: 'Unknown' },
    },
  },
  { timestamps: true }
);

if (mongoose.models.Sale) {
  delete mongoose.models.Sale;
}
export default mongoose.model('Sale', SaleSchema);
