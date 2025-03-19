import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
// TODO: implement file size reduction (https://github.com/tonsisouvanh/file-upload-aws-s3)
// Dynamic file upload function allow multiple files upload at once which store in the req.files object
export const uploadFile = async (req: any, dest: string): Promise<any> => {
  if (!req.files) throw new Error("No files uploaded");

  const files: any = req.files;
  let uploadedFiles: any = [];

  const processFile = async (file: any) => {
    const uuidName = uuidv4();
    const newFileName = `${path.parse(uuidName).name}${path.extname(
      file.name
    )}`;
    const uploadPath = path.join(__dirname, `../uploads/${dest}`, newFileName);

    await fs.mkdir(path.dirname(uploadPath), { recursive: true });
    await file.mv(uploadPath);

    const fileUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/${dest}/${newFileName}`;
    uploadedFiles.push({
      fileName: newFileName,
      url: fileUrl,
      filePath: dest
        ? `uploads/${dest}/${newFileName}`
        : `uploads/${newFileName}`,
      size: (file.size / 1024 / 1024).toFixed(2),
      type: file.mimetype,
    });
  };

  if (Array.isArray(files.files)) {
    for (const file of files.files) {
      await processFile(file);
    }
  } else {
    for (const key of Object.keys(files)) {
      const file = files[key];
      await processFile(file);
    }
  }

  return uploadedFiles;
};

// Implement single file upload ref to functino above
export const uploadSingleFile = async (
  req: any,
  file: any,
  dest: string
): Promise<any> => {
  if (!file) return null;

  const uuidName = uuidv4();
  const newFileName = `${path.parse(uuidName).name}${path.extname(file.name)}`;
  const uploadPath = path.join(__dirname, `../uploads/${dest}`, newFileName);

  await fs.mkdir(path.dirname(uploadPath), { recursive: true });
  await file.mv(uploadPath);

  const fileUrl = `${req.protocol}://${req.get(
    "host"
  )}/uploads/${dest}/${newFileName}`;
  return {
    fileName: newFileName,
    url: fileUrl,
    filePath: `uploads/${dest}/${newFileName}`,
    size: (file.size / 1024 / 1024).toFixed(2),
    type: file.mimetype,
  };
};

// Implement file delete function
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const fullPath = path.join(__dirname, `../${filePath}`);
    await fs.unlink(fullPath);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.warn(`File not found: ${filePath}`);
      throw new Error("ENOENT");
    } else {
      console.error(`Error deleting file: ${filePath}`, error);
      throw new Error("File delete failed");
    }
  }
};
