import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { sharpService } from "./SharpService.js";
import sharp from "sharp";

const IAMKEY = process.env.AWS_IAM_ACCESS_KEY
const SECRET = process.env.AWS_SECRET_KEY

const client = new S3Client({
  region: 'us-west-2',
  credentials: { accessKeyId: IAMKEY, secretAccessKey: SECRET, }
})

class UploadService {
  async uploadImage(file, userId) {
    const uploadRequest = new PutObjectCommand({
      Bucket: 'cw-upload-demo',
      Key: userId + '/' + file.name,
      Body: file.data,
      ContentType: file.mimetype,
      CacheControl: 'max-age=36000'
    })
    const response = await client.send(uploadRequest)
    console.log('uploaded completed', response)
    let string = `https://cw-upload-demo.s3.us-west-2.amazonaws.com/${userId}/${file.name}`
    return string
  }

  async deleteImage(fileName, userId) {
    const deleteRequest = new DeleteObjectCommand({
      Bucket: 'cw-upload-demo',
      Key: userId + '/' + fileName
    })
    const response = await client.send(deleteRequest)
    if (response.$metadata.httpStatusCode != 200) throw new Error("Could not delete")
    console.log('deleted', response)
    return 'deleted ' + fileName
  }


  async uploadWithSharp(file, userId) {
    if (file.data.length > 50 * 1024) throw new Error("FILE TOO BIG")
    const sharpImg = sharp(file.data)
    const shrunkImg = await sharpService.shrink(sharpImg)
    const jpegImg = await sharpService.toJPEG(shrunkImg)
    file.data = await jpegImg.toBuffer()
    file.mimetype = 'image/jpg'
    file.name = file.name.split('.')[0] + '.jpg' // changing to a jpeg
    const url = await this.uploadImage(file, userId)
    return { url }
  }

}

export const uploadService = new UploadService()
