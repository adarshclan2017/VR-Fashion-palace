import mongoose from 'mongoose';

const StoreSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // e.g. 'sections', 'categories'
    value: { type: mongoose.Schema.Types.Mixed, required: true }, // flexible data
  },
  { timestamps: true }
);

if (mongoose.models.StoreSettings) {
  delete mongoose.models.StoreSettings;
}
export default mongoose.model('StoreSettings', StoreSettingsSchema);
