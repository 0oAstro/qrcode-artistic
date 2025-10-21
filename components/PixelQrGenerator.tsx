"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Dithering } from "@paper-design/shaders-react"
import { Download, Copy } from "lucide-react"

interface GeneratedQR {
  url: string
  content: string
  description?: string
}


export function PixelQrGenerator() {
  // Log environment variables for debugging
  useEffect(() => {
    console.log('Environment variables debug:')
    console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
    console.log('All env vars starting with NEXT_PUBLIC:',
      Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')))
  }, [])

  const [image1, setImage1] = useState<File | null>(null)
  const [image1Preview, setImage1Preview] = useState<string>("")
  const [image1Url, setImage1Url] = useState<string>("")
  const [imageUrlInput, setImageUrlInput] = useState<string>("")
  const scale = 48 // Fixed scale value
    const [isLoading, setIsLoading] = useState(false)
  const [isConvertingHeic, setIsConvertingHeic] = useState(false)
  const [heicProgress, setHeicProgress] = useState(0)
  const [generatedQR, setGeneratedQR] = useState<GeneratedQR | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [progress, setProgress] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [qrContent, setQrContent] = useState("")
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const validateImageFormat = (file: File): boolean => {
    const supportedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "image/gif",
      "image/bmp",
      "image/tiff",
    ]

    // Check MIME type first
    if (supportedTypes.includes(file.type.toLowerCase())) {
      return true
    }

    // Fallback: check file extension for HEIC files (browsers sometimes don't set correct MIME type)
    const fileName = file.name.toLowerCase()
    const supportedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".gif", ".bmp", ".tiff"]

    return supportedExtensions.some((ext) => fileName.endsWith(ext))
  }

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        // Handle image files - always handle images regardless of focus
        if (item.type.startsWith("image/")) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            // Always use the first slot
            handleImageUpload(file)
          }
          return
        }


      }
    }

    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [image1])



  
  const convertHeicToPng = async (file: File): Promise<File> => {
    try {
      setHeicProgress(0)

      // Simulate progress during conversion
      const progressInterval = setInterval(() => {
        setHeicProgress((prev) => {
          if (prev >= 95) return prev
          return prev + Math.random() * 15 + 5
        })
      }, 50)

      // Import heic-to dynamically
      const { heicTo } = await import("heic-to")

      setHeicProgress(70)

      const convertedBlob = await heicTo({
        blob: file,
        type: "image/jpeg",
        quality: 0.9,
      })

      setHeicProgress(90)

      const convertedFile = new File([convertedBlob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
        type: "image/jpeg",
      })

      clearInterval(progressInterval)
      setHeicProgress(100)

      // Small delay to show 100%
      await new Promise((resolve) => setTimeout(resolve, 200))

      return convertedFile
    } catch (error) {
      console.error("HEIC conversion error:", error)
      throw new Error("Could not convert HEIC image. Please try using a different image format.")
    }
  }

  const handleImageUpload = async (file: File) => {
    console.log("Uploading image:", file.name)

    if (!validateImageFormat(file)) {
      showToast("Please select a valid image file.", "error")
      return
    }

    let processedFile = file
    const isHeic =
      file.type.toLowerCase().includes("heic") ||
      file.type.toLowerCase().includes("heif") ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif")

    if (isHeic) {
      try {
        console.log("Converting HEIC image to JPEG...")
        setIsConvertingHeic(true)
        processedFile = await convertHeicToPng(file)
        console.log("HEIC conversion successful")
        setIsConvertingHeic(false)
      } catch (error) {
        console.error("Error converting HEIC:", error)
        setIsConvertingHeic(false)
        showToast("Error converting HEIC image. Please try a different format.", "error")
        return
      }
    }

  
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      console.log("Image loaded successfully, setting preview")
      setImage1(processedFile) // Use processed file instead of original
      setImage1Preview(result)
      console.log("Image 1 preview set:", result.substring(0, 50) + "...")
    }
    reader.onerror = (error) => {
      console.error("Error reading file:", error)
      showToast("Error reading the image file. Please try again.", "error")
    }
    reader.readAsDataURL(processedFile) // Read processed file instead of original
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    console.log("File dropped")
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      console.log("Valid image file dropped:", file.name)
      handleImageUpload(file)
    } else {
      console.log("Invalid file type or no file:", file?.type)
      showToast("Please drop a valid image file", "error")
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input changed")
    const file = e.target.files?.[0]
    if (file) {
      console.log("File selected:", file.name, file.type)
      handleImageUpload(file)
      e.target.value = ""
    } else {
      console.log("No file selected")
    }
  }

  const handleUrlChange = (url: string) => {
    console.log("URL changed:", url)
    setImage1Url(url)
    setImage1Preview(url)
    setImage1(null)
  }

  const handleImageUrlChange = (url: string) => {
    console.log("Image URL changed:", url)
    setImageUrlInput(url)
    if (url.trim()) {
      setImage1Url(url)
      setImage1Preview(url)
      setImage1(null)
    }
  }



  const generateQrCode = async () => {
    if (!qrContent.trim()) return

    setIsLoading(true)
    setGeneratedQR(null)
    setImageLoaded(false)
    setProgress(0)
    setShowAnimation(true)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) {
          return Math.min(prev + 0.1, 98)
        } else if (prev >= 90) {
          return prev + 0.3
        } else if (prev >= 75) {
          return prev + 0.6
        } else if (prev >= 50) {
          return prev + 0.9
        } else if (prev >= 25) {
          return prev + 1.1
        } else {
          return prev + 1.3
        }
      })
    }, 100)

    try {
      const formData = new FormData()
      formData.append("url", qrContent)
      formData.append("scale", scale.toString())

      if (image1Url) {
        formData.append("background_url", image1Url)
      } else {
        if (image1) {
          formData.append("image", image1)
        }
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      console.log('API URL being used:', apiUrl)
      console.log('Full API endpoint:', `${apiUrl}/generate-qr`)
      console.log('Making API call...')
      const response = await fetch(`${apiUrl}/generate-qr`, {
        method: "POST",
        body: formData,
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        console.log('Response not OK, parsing error...')
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.log('Error data:', errorData)
        throw new Error(`${errorData.error}${errorData.details ? `: ${errorData.details}` : ""}`)
      }

      console.log('Response OK, parsing JSON...')
      const data = await response.json()
      console.log('Response data:', data)
      clearInterval(progressInterval)

      setProgress(99)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setProgress(100)

      setImageLoaded(true)

      // Add cache-busting parameter to prevent browser from showing cached images
      const cacheBustingData = {
        ...data,
        url: data.url.includes('#') ? data.url : `${data.url}#cb=${Date.now()}`
      }
      setGeneratedQR(cacheBustingData)
      setIsLoading(false)
      setShowAnimation(false)
      setProgress(0)
    } catch (error) {
      clearInterval(progressInterval)
      setProgress(0)
      setShowAnimation(false)
      console.error("Error generating image:", error)

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      showToast(`Error generating image: ${errorMessage}`, "error")
      setIsLoading(false)
    }
  }

  const downloadQr = async () => {
    if (generatedQR) {
      try {
        const response = await fetch(generatedQR.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `qr-code-result.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error("Error downloading QR code:", error)
        window.open(generatedQR.url, "_blank")
      }
    }
  }

  const copyQrToClipboard = async () => {
    if (generatedQR) {
      try {
        setToast({ message: "Copying QR code...", type: "success" })

        // Ensure window is focused
        window.focus()

        const response = await fetch(generatedQR.url, { mode: "cors" })

        if (!response.ok) {
          throw new Error("Failed to fetch QR code")
        }

        const blob = await response.blob()
        const clipboardItem = new ClipboardItem({ "image/png": blob })
        await navigator.clipboard.write([clipboardItem])

        setToast({ message: "QR code copied to clipboard!", type: "success" })
        setTimeout(() => setToast(null), 2000)
      } catch (error) {
        console.error("Error copying QR code:", error)
        if (error instanceof Error && error.message.includes("not focused")) {
          setToast({ message: "Please click on the page first, then try copying again", type: "error" })
        } else {
          setToast({ message: "Failed to copy QR code to clipboard", type: "error" })
        }
      }
    }
  }

  const clearImage = () => {
    setImage1(null)
    setImage1Preview("")
    setImage1Url("")
    setImageUrlInput("")
  }



  const canGenerate = qrContent.trim().length > 0



  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      if (canGenerate && !isLoading) {
        generateQrCode()
      }
    }
  }

  return (
    <div
      className="bg-background min-h-screen flex items-center justify-center select-none"
    >
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300 select-none">
          <div
            className={cn(
              "bg-black/90 backdrop-blur-sm border rounded-lg p-4 shadow-lg max-w-sm",
              toast.type === "success" ? "border-green-500/50 text-green-100" : "border-red-500/50 text-red-100",
            )}
          >
            <div className="flex items-center gap-3">
              {toast.type === "success" ? (
                <svg
                  className="w-5 h-5 text-green-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-red-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          </div>
        </div>
      )}



      <div className="fixed inset-0 z-0 select-none">
        <Dithering
          colorBack="#3D2817"
          colorFront="#D9A066"
          speed={0.43}
          shape="wave"
          type="4x4"
          pxSize={3}
          scale={1.13}
          style={{
            backgroundColor: "#3D2817",
            height: "100vh",
            width: "100vw",
          }}
        />
      </div>

      <div className="relative z-10 p-2 md:p-6 w-full max-w-6xl mx-auto select-none">
        <div className="bg-black/70 backdrop-blur-sm border-0 p-3 md:p-8 rounded-xl">
          <div className="mb-4 md:mb-8">
            <h1 className="text-lg md:text-2xl font-bold text-white select-none">QR Code Artistic Generator</h1>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-12">
            {/* Input Section */}
            <div className="space-y-4 md:space-y-8">
              <div className="flex flex-nowrap items-center justify-between gap-1 md:gap-2 select-none">
                <h3 className="text-sm md:text-lg font-semibold flex items-center gap-1 md:gap-2 text-white flex-shrink-0">
                  <svg
                    className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
                  </svg>
                  <span className="hidden sm:inline">QR Code Settings</span>
                </h3>
                              </div>

              <div className="space-y-3 md:space-y-6">
                <div className="mb-3 md:mb-6 select-none">
                  <label className="text-xs md:text-sm font-medium text-gray-300">
                    QR Code Content
                  </label>
                </div>
                <input
                  type="text"
                  value={qrContent}
                  onChange={(e) => setQrContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter URL or text for QR code..."
                  className="w-full h-12 p-2 md:p-4 bg-black/50 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-white text-white text-xs md:text-base select-text"
                  style={{
                    fontSize: "16px", // Prevents zoom on iOS Safari
                    WebkitUserSelect: "text",
                    userSelect: "text",
                  }}
                />
                </div>

              <div className="space-y-3 md:space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3 md:mb-6 select-none">
                    <label className="text-xs md:text-sm font-medium text-gray-300">Background Image</label>
                                      </div>

                                      <div className="space-y-4 select-none" style={{ minHeight: "80px" }}>
                      <div>
                        <label className="text-xs text-gray-400 block mb-2">Enter image URL:</label>
                        <input
                          type="text"
                          value={imageUrlInput}
                          onChange={(e) => handleImageUrlChange(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="w-full h-10 p-2 bg-black/50 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-white text-white text-xs"
                        />
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-black/70 px-2 text-gray-400">or</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 block mb-2">Upload background image:</label>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:flex lg:justify-start lg:gap-4">
                        <div
                          className={cn(
                            "w-full h-[60px] sm:h-[80px] lg:w-[140px] lg:h-[120px] lg:flex-shrink-0 border border-gray-600 rounded flex items-center justify-center cursor-pointer hover:border-white transition-all bg-black/30 relative",
                            image1Preview && "border-white",
                          )}
                          onDrop={(e) => handleDrop(e)}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => document.getElementById("file1")?.click()}
                        >
                          {image1Preview ? (
                            <div className="w-full h-full p-1 sm:p-2 relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  clearImage()
                                }}
                                className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full p-0.5 sm:p-1 transition-colors"
                              >
                                <svg
                                  className="w-2 h-2 sm:w-3 sm:h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                              <img
                                src={image1Preview || "/placeholder.svg"}
                                alt="Background Image"
                                className="w-full h-full object-contain rounded"
                              />
                            </div>
                          ) : (
                            <div className="text-center text-gray-300 py-1 sm:py-4">
                              <svg
                                className="w-3 h-3 sm:w-5 sm:h-5 md:w-6 md:h-6 mx-auto mb-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                              </svg>
                              <p className="text-xs">Upload Background</p>
                            </div>
                          )}
                          <input
                            id="file1"
                            type="file"
                            accept="image/*,.heic,.heif"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e)}
                          />
                        </div>
                        </div>
                      </div>
                    </div>
                </div>
              </div>

              <div className="lg:hidden">
                <Button
                  onClick={generateQrCode}
                  disabled={!canGenerate || isLoading || isConvertingHeic}
                  className="w-full h-10 text-sm font-semibold bg-white text-black hover:bg-gray-200 rounded"
                >
                  {isConvertingHeic ? "Converting HEIC..." : isLoading ? "Running..." : "Run"}
                </Button>
              </div>

              <div className="pt-3 hidden lg:block">
                <Button
                  onClick={generateQrCode}
                  disabled={!canGenerate || isLoading || isConvertingHeic}
                  className="w-full h-10 md:h-12 text-sm md:text-base font-semibold bg-white text-black hover:bg-gray-200 rounded"
                >
                  {isConvertingHeic ? "Converting HEIC..." : isLoading ? "Running..." : "Run"}
                </Button>
              </div>
            </div>

            {/* Result Section */}
            <div className="space-y-4 md:space-y-8 select-none">
              <div className="flex items-center justify-between">
                <h3 className="text-sm md:text-lg font-semibold flex items-center gap-2 text-white">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21,15 16,10 5,21" />
                  </svg>
                  Result
                </h3>
                {generatedQR && (
                  <div className="flex gap-1 md:gap-2">
                    <Button
                      onClick={downloadQr}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2 bg-transparent border-gray-600 text-white hover:bg-gray-700"
                      title="Download"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={copyQrToClipboard}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2 bg-transparent border-gray-600 text-white hover:bg-gray-700"
                      title="Copy to Clipboard"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center h-48 md:h-80 p-2 md:p-4">
                {isLoading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center px-4 select-none">
                    <div className="w-full max-w-md">
                      <div
                        className="relative h-4 md:h-8 bg-[#3D2817] border border-gray-600 rounded overflow-hidden mb-4"
                        style={{ zIndex: 30 }}
                      >
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{
                            backgroundImage: `
                              linear-gradient(90deg, transparent 0%, transparent 49%, #D9A066 49%, #D9A066 51%, transparent 51%),
                              linear-gradient(0deg, transparent 0%, transparent 49%, #D9A066 49%, #D9A066 51%, transparent 51%)
                            `,
                            backgroundSize: "8px 8px",
                          }}
                        />

                        <div
                          className="absolute top-0 left-0 h-full transition-all duration-100 ease-out"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: "#D9A066",
                          }}
                        />

                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs md:text-sm font-mono text-white/80" style={{ zIndex: 40 }}>
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-xs md:text-sm font-medium text-white animate-pulse">Running...</p>
                      </div>
                    </div>
                  </div>
                ) : isConvertingHeic ? (
                  <div className="w-full h-full flex flex-col items-center justify-center px-4 select-none">
                    <div className="w-full max-w-md">
                      <div
                        className="relative h-4 md:h-8 bg-[#3D2817] border border-gray-600 rounded overflow-hidden mb-4"
                        style={{ zIndex: 30 }}
                      >
                        <div
                          className="absolute top-0 left-0 h-full transition-all duration-200 ease-out"
                          style={{
                            width: `${heicProgress}%`,
                            backgroundColor: "#D9A066",
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className="text-xs md:text-sm font-mono text-white/90 font-semibold"
                            style={{ zIndex: 40 }}
                          >
                            {Math.round(heicProgress)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs md:text-sm font-medium text-white/90">Converting HEIC image...</p>
                      </div>
                    </div>
                  </div>
                ) : generatedQR ? (
                  <div className="w-full h-full flex flex-col select-none p-2 md:p-4">
                    <div className="flex-1 flex items-center justify-center relative group">
                      <div className="p-2 md:p-4 bg-white/5 rounded-lg border border-gray-700/30 w-full h-full flex items-center justify-center overflow-hidden">
                        <img
                          src={generatedQR.url || "/placeholder.svg"}
                          alt="Generated"
                          className={`max-w-full max-h-full object-contain rounded transition-opacity duration-500 ${
                            imageLoaded ? "opacity-100" : "opacity-0"
                          } sm:max-h-[140px] sm:max-w-[140px] md:max-h-[200px] md:max-w-[200px] lg:max-h-[280px] lg:max-w-[280px]`}
                          style={{
                            transform: imageLoaded ? "scale(1)" : "scale(1.05)",
                            transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
                            maxHeight: "120px",
                            maxWidth: "120px",
                          }}
                        />
                      </div>
                    </div>
                    </div>
                ) : (
                  <div className="text-center py-6 select-none">
                    <div className="w-8 h-8 md:w-16 md:h-16 mx-auto mb-3 border border-gray-600 rounded flex items-center justify-center bg-black/50">
                      <svg
                        className="w-4 h-4 md:w-8 md:h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21,15 16,10 5,21" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-400 font-medium py-1 md:py-2">Ready to generate</p>
                  </div>
                )}
              </div>
            </div>
          </div>


        </div>
      </div>


    </div>
  )
}
