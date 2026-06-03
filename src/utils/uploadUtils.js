export const uploadImageToCloudinary = async (file) => {
    // Siapkan "koper" data yang akan dikirim ke Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    formData.append("cloud_name", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

    try {
        // Kirim ke API Cloudinary
        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!res.ok) throw new Error("Gagal mengunggah gambar ke Cloudinary");

        const data = await res.json();
        
        // Cloudinary akan membalas dengan link URL gambar yang aman (HTTPS)
        return data.secure_url; 
    } catch (error) {
        console.error("Error upload:", error);
        throw error;
    }
};