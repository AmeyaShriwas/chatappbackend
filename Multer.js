const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: (req, file, cb)=> {
        cb(null, "upload/")
    },
    filename: (req, file, cb)=> {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})

const fileFilter = (req, file, cb)=> {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"]
    if(allowedTypes.includes(file.mimetype)){
        cb(null, true)
    }
    else{
        cb(new Error("Invalid File Type"))
    }
}

const upload = multer({
    storage,
    limits: {fileSize: 5 * 1024 * 1024},
    fileFilter
})

module.export = upload