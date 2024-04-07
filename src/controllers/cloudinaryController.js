const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');

cloudinary.config({
    cloud_name: 'dekjrisqs',
    api_key: '731895814817394',
    api_secret: 'muAkoW6rNxtml8X6ObnBsT-NveY'
});
const storage = multer.memoryStorage({
    destination: function (req, file, cb) {
        cb(null, ''); // Thư mục lưu trữ video tạm thời
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Giữ nguyên tên tập tin
    }
});

const upload = multer({ storage: storage });

const uploadVideoToCloudinary = async (req, res) => {

    try {
   console.log("có network nè")
        fs.writeFileSync('temp_video.mp4', req.file.buffer);

        // Upload video lên Cloudinary từ tập tin đã lưu
        const result = await cloudinary.uploader.upload('temp_video.mp4', { resource_type: "video" });

        // Xóa tập tin tạm thời sau khi upload thành công
        fs.unlinkSync('temp_video.mp4');
        console.log(result)
        // Trả về URL của video đã được upload thành công
        return res.status(200).json({ success: true, message: 'Video uploaded successfully', url: result });
    } catch (error) {
        console.error('Error uploading video to Cloudinary:', error);
        return res.status(500).json({ success: false, message: 'Failed to upload video to Cloudinary', error: error.message });
    }
};
module.exports = {
    uploadVideo: upload.single('video'), // Middleware để xử lý yêu cầu upload video
    handleUpload: uploadVideoToCloudinary
};