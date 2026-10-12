import mongoose from 'mongoose';

const InwardItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  code: { type: String, required: true },
  rollNumber: { type: String, required: true },
  meters: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  batchNo: { type: String, default: '' },
});

const StockInwardSchema = new mongoose.Schema(
  {
    referenceNo: { type: String, required: true, unique: true },
    supplierName: { type: String, required: true },
    supplierBillNo: { type: String, default: '' },
    inwardDate: { type: Date, default: Date.now },
    items: [InwardItemSchema],
    totalMeters: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.StockInward || mongoose.model('StockInward', StockInwardSchema);
