// ======================= dynamic file upload =======================//
import express, { Router } from "express";
import multer from "multer";
import { uploadImageToCloudinary } from "../services/upload-cloudinary.serverice";
import { deleteFile } from "../services/upload.service";
const router: Router = express.Router();

// router.post(
//   "/",
//   fileUpload({ createParentPath: true }),
//   filesPayloadExists,
//   fileExtLimiter([".png", ".jpg", ".jpeg", ".pdf"]),
//   fileSizeLimiter,
//   (req: any, res: any) => {
//     const files = (req as any & { files: any }).files;
//     const dest = req.body?.dest;
//     let filenames: string[] = [];

//     if (!files) {
//       return res.status(400).json({ message: "No files were uploaded." });
//     }

//     const uploadPath = dest
//       ? path.join(__dirname, `../uploads/${dest}`)
//       : path.join(__dirname, "../uploads");

//     try {
//       if (Array.isArray(files.files)) {
//         files.files.forEach((file: any) => {
//           const uuidName = uuidv4();
//           const newName = `${path.parse(uuidName).name}${path.extname(
//             file.name
//           )}`;
//           const filepath = path.join(uploadPath, newName);

//           if (!filepath) {
//             return res
//               .status(500)
//               .json({ status: "error", message: "File path is undefined." });
//           }
//           file.mv(filepath, (err: any) => {
//             if (err)
//               return res.status(500).json({ status: "error", message: err });
//           });
//           filenames.push(newName);
//         });
//       } else {
//         // Single file handle
//         Object.keys(files).forEach((key) => {
//           const uuidName = uuidv4();
//           const newName = `${path.parse(uuidName).name}${path.extname(
//             files[key].name
//           )}`;
//           const filepath = path.join(uploadPath, newName);
//           filenames.push(newName);
//           files[key].mv(filepath, (err: any) => {
//             if (err)
//               return res.status(500).json({ status: "error", message: err });
//           });
//         });
//       }

//       const uploadedFiles = filenames.map((filename) => {
//         return {
//           url: dest
//             ? `${req.protocol}://${req.get("host")}/uploads/${dest}/${filename}`
//             : `${req.protocol}}://${req.get("host")}/uploads/${filename}`,
//           fileName: filename,
//           fileNameWithPath: dest
//             ? `uploads/${dest}/${filename}`
//             : `uploads/${filename}`,
//         };
//       });

//       return res.json({
//         status: "success",
//         uploadedFiles,
//       });
//     } catch (err: any) {
//       return res.status(500).json({ status: "error", message: err.message });
//     }
//   }
// );

// Route to handle file deletion
router.post("/delete", async (req: any, res: any) => {
  const { filePath } = req.body;
  try {
    await deleteFile(filePath);
    res.json({ status: "success", message: "File deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting file: ${filePath}`, error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ##################################################################### //
// ######################### Cloudinary upload ######################## //
// ##################################################################### //
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(null, false);
    } else {
      cb(null, true);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.post(
  "/cloudinary-upload-test",
  upload.array("images", 5),
  async (req: any, res: any): Promise<any> => {
    try {
      const { title, content } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" });
      }

      // First create the post to get its ID
      // const post = await prisma.post.create({
      //   data: { title, content },
      // });

      // Upload images with custom options
      const imagePromises = files.map(async (file, index) => {
        const result = await uploadImageToCloudinary(file.buffer, {
          // folder: `paisaid/posts/${post.id}`, // Custom path with post ID
          folder: `paisaid/posts`, // Custom path with post ID
          publicId: `image_${index}`, // Unique name per image
          // transformations: { width: 800, height: 600, crop: "fit" }, // Resize
          // overwrite: true, // Overwrite if same public_id exists
        });
        return { url: result.secure_url, publicId: result.public_id };
      });

      const uploadedImages = await Promise.all(imagePromises);

      // Store images in database with public_id for later deletion
      // const postWithImages = await prisma.post.update({
      //   where: { id: post.id },
      //   data: {
      //     images: {
      //       create: uploadedImages.map((img) => ({
      //         url: img.url,
      //         publicId: img.publicId,
      //       })),
      //     },
      //   },
      //   include: { images: true },
      // });

      res.status(201).json(uploadedImages);
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

export default router;
