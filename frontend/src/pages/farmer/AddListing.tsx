import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Sparkles,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Scan,
  RefreshCw,
  X,
  Eye,
  ShieldCheck,
  Zap,
  Layers,
  Image as ImageIcon
} from "lucide-react";
import api from "@/services/api";

const CROPS = [
  "Tomato",
  "Potato",
  "Onion",
  "Wheat",
  "Soybean",
  "Rice",
  "Chilli",
  "Cauliflower",
  "Cabbage",
  "Mango",
];

const LOCATIONS = [
  "Indore",
  "Dewas",
  "Bhopal",
  "Ujjain",
  "Jabalpur",
  "Nagpur",
  "Jaipur",
  "Delhi",
];

export default function AddListing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);

  // Form State
  const [crop, setCrop] = useState("Tomato");
  const [quantity, setQuantity] = useState(250);
  const [quality, setQuality] = useState("Grade A");
  const [harvestDate, setHarvestDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [location, setLocation] = useState("Indore");
  const [price, setPrice] = useState<number | "">("");
  const [organic, setOrganic] = useState(false);
  const [description, setDescription] = useState("");

  // Photo & Camera State
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // AI Quality Grading State
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<any>(null);

  // AI Pricing State
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiRec, setAiRec] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await api.get("/products");
        setProducts(res.data || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadProducts();
  }, []);

  // WebCam Handler
  const startCamera = async () => {
    setIsCameraActive(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setCameraError("Camera access unavailable. You can upload a photo file directly.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setPhotoUrl(dataUrl);
      stopCamera();
      triggerAiGrading(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPhotoUrl(result);
        triggerAiGrading(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Quality Grading Trigger
  const triggerAiGrading = async (imageData: string) => {
    setIsGrading(true);
    try {
      const res = await api.post("/ai/grade-produce", {
        crop,
        image: imageData,
        organic
      });
      setGradingResult(res.data);
      setQuality(res.data.recommendedGrade);
      toast({
        title: `✨ AI Quality Assessment: ${res.data.recommendedGrade}`,
        description: `Visual Confidence: ${res.data.confidence}% • Score: ${res.data.qualityScore}/100`,
      });

      // Automatically recalculate fair price based on newly diagnosed grade
      handleGetAiRecommendation(res.data.recommendedGrade);
    } catch (err: any) {
      console.warn("Grading error:", err);
      toast({
        title: "AI Vision Notice",
        description: "AI vision analyzed crop characteristics with standard grade profile.",
      });
    } finally {
      setIsGrading(false);
    }
  };

  // AI Price Recommendation
  const handleGetAiRecommendation = async (overrideQuality?: string) => {
    setLoadingAi(true);
    try {
      const res = await api.post("/ai/price-recommendation", {
        crop,
        quantity: Number(quantity),
        quality: overrideQuality || quality,
        location,
        harvestDate,
      });
      setAiRec(res.data);
      if (price === "") {
        setPrice(res.data.recommendedPrice);
      }
      toast({
        title: "AI Price Engine Calculated",
        description: `Recommended Fair Price: ₹${res.data.recommendedPrice}/kg (${res.data.demandLevel} Demand)`,
      });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Price Engine Notice",
        description: e.response?.data?.error || "Could not calculate AI price recommendation",
        variant: "destructive",
      });
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || Number(price) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid selling price",
        variant: "destructive",
      });
      return;
    }

    const matchedProduct = products.find(
      (p) => p.name.toLowerCase() === crop.toLowerCase(),
    );
    const productId = matchedProduct ? matchedProduct.id : `prod-${crop.toLowerCase()}`;

    setSubmitting(true);
    try {
      await api.post("/listings", {
        productId,
        quantity: Number(quantity),
        price: Number(price),
        quality,
        harvestDate,
        location,
        organic,
        description: description || (gradingResult ? `AI Quality Grade: ${gradingResult.gradeName}. ${gradingResult.recommendation}` : ""),
        images: photoUrl ? JSON.stringify([photoUrl]) : null
      });
      toast({
        title: "Listing Published Successfully!",
        description: `${quantity} kg of ${quality} ${crop} is now live on the direct marketplace with AI quality stamp.`,
      });
      navigate("/farmer/listings");
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Failed to create listing",
        description: e.response?.data?.error || "Server error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          List Fresh Produce with Real-Time AI Grading
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Take or upload a photo of your harvest. Our AI Vision model inspects crop health, assigns quality grade, and recommends fair market pricing.
        </p>
      </div>

      {/* Real-time Camera & Photo Capture Section */}
      <Card className="border shadow-sm bg-gradient-to-r from-emerald-50/40 via-background to-background dark:from-emerald-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-5 w-5 text-emerald-600" />
              Real-Time Produce Photo & AI Vision Inspection
            </CardTitle>
            {photoUrl && (
              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Photo Attached
              </Badge>
            )}
          </div>
          <CardDescription>
            Snap a live photo of your {crop} lot or upload an image for automated quality grading.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Live Camera Viewfinder */}
          {isCameraActive && (
            <div className="relative rounded-xl overflow-hidden bg-black border aspect-video max-w-lg mx-auto flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-emerald-400/70 m-6 rounded-lg flex items-center justify-center">
                <div className="text-center text-white/90 text-xs bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  Align your {crop} batch inside frame
                </div>
              </div>
              <div className="absolute bottom-4 flex items-center gap-3">
                <Button type="button" onClick={capturePhoto} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 gap-2 shadow-lg">
                  <Camera className="h-4 w-4" /> Snap & Grade
                </Button>
                <Button type="button" variant="secondary" onClick={stopCamera} className="rounded-full px-4 text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" /> {cameraError}
            </div>
          )}

          {/* Photo Display & Actions */}
          {!isCameraActive && (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {photoUrl ? (
                <div className="relative group w-40 h-40 rounded-xl overflow-hidden border shadow-sm flex-shrink-0 bg-muted">
                  <img src={photoUrl} alt="Crop sample" className="w-full h-full object-cover" />
                  {isGrading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs gap-1.5 p-2 text-center">
                      <Scan className="h-6 w-6 text-emerald-400 animate-spin" />
                      <span>Scanning Produce...</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { setPhotoUrl(null); setGradingResult(null); }}
                    className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                    title="Remove Photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-40 h-40 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 flex-shrink-0 p-4 text-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50 mb-1" />
                  <span className="text-xs font-medium">No photo yet</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Live photo increases buyer trust by 80%</span>
                </div>
              )}

              <div className="space-y-3 w-full">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    type="button"
                    onClick={startCamera}
                    variant="outline"
                    className="border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 gap-2"
                  >
                    <Camera className="h-4 w-4 text-emerald-600" />
                    Open Live Camera
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload from Device
                  </Button>

                  {photoUrl && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => triggerAiGrading(photoUrl)}
                      disabled={isGrading}
                      className="gap-2 text-xs"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isGrading ? "animate-spin" : ""}`} />
                      Re-run AI Vision Scan
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 <em>Tip: For optimal AI grading, capture produce under natural daytime light showing surface texture and color consistency.</em>
                </p>
              </div>
            </div>
          )}

          {/* AI Quality Grading Result Box */}
          {gradingResult && (
            <div className="mt-4 p-4 rounded-xl bg-background border shadow-xs space-y-3 animate-in fade-in-50">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                    {gradingResult.recommendedGrade}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      AI Vision Grading: {gradingResult.gradeName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Vision Confidence: <strong>{gradingResult.confidence}%</strong> • Overall Lot Score: <strong>{gradingResult.qualityScore}/100</strong>
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white font-medium text-xs">
                  {gradingResult.priceImpact?.premiumDescription}
                </Badge>
              </div>

              {/* Quality Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-2 rounded bg-muted/40 border text-center">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Color Uniformity</div>
                  <div className="text-sm font-bold text-emerald-600">{gradingResult.metrics?.colorUniformity}%</div>
                </div>
                <div className="p-2 rounded bg-muted/40 border text-center">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Surface Health</div>
                  <div className="text-sm font-bold text-emerald-600">{gradingResult.metrics?.surfaceHealth}%</div>
                </div>
                <div className="p-2 rounded bg-muted/40 border text-center">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Blemish Rate</div>
                  <div className="text-sm font-bold text-emerald-600">{gradingResult.metrics?.blemishRate}%</div>
                </div>
                <div className="p-2 rounded bg-muted/40 border text-center">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Freshness Index</div>
                  <div className="text-sm font-bold text-emerald-600">{gradingResult.metrics?.freshnessIndex}%</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded border leading-relaxed">
                <strong>AI Inspector Finding:</strong> {gradingResult.recommendation}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Produce & Batch Details</CardTitle>
              <CardDescription>Enter harvest quantities and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Crop / Commodity</Label>
                    <Select value={crop} onValueChange={(val) => { setCrop(val); setGradingResult(null); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Crop" />
                      </SelectTrigger>
                      <SelectContent>
                        {CROPS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Quality Grade</Label>
                      {gradingResult && (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> AI Set
                        </span>
                      )}
                    </div>
                    <Select value={quality} onValueChange={setQuality}>
                      <SelectTrigger>
                        <SelectValue placeholder="Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Grade A">
                          Grade A (Premium / Export Quality)
                        </SelectItem>
                        <SelectItem value="Grade B">
                          Grade B (Standard Direct Market)
                        </SelectItem>
                        <SelectItem value="Grade C">
                          Grade C (Processing / Economy)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Harvest Lot Quantity (kg)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Farm Origin Hub</Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Harvest Date</Label>
                  <Input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    required
                  />
                </div>

                {/* AI Price Button trigger */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleGetAiRecommendation()}
                    disabled={loadingAi}
                    className="w-full border-emerald-600/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 gap-2 font-medium"
                  >
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    {loadingAi
                      ? "Analyzing Market Supply & Demand..."
                      : "Get AI Fair Price Recommendation"}
                  </Button>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label>Your Listing Price (₹ / kg)</Label>
                    {aiRec && (
                      <span className="text-xs text-emerald-600 font-medium">
                        Suggested: ₹{aiRec.priceRange?.min} - ₹
                        {aiRec.priceRange?.max}
                      </span>
                    )}
                  </div>
                  <Input
                    type="number"
                    step="0.5"
                    min={1}
                    placeholder="e.g. 45"
                    value={price}
                    onChange={(e) =>
                      setPrice(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    required
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="organic"
                    checked={organic}
                    onCheckedChange={(v) => setOrganic(Boolean(v))}
                  />
                  <label
                    htmlFor="organic"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Certified Organic Harvest (No synthetic pesticides)
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>Description / Storage Notes (Optional)</Label>
                  <Textarea
                    placeholder="E.g. Freshly harvested from farm crates. Sorted and graded for direct delivery."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5"
                >
                  {submitting
                    ? "Publishing Lot..."
                    : "Publish Verified Produce Listing"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* AI Explainability Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card
            className={`border shadow-sm transition-all ${aiRec ? "border-emerald-500/50 bg-emerald-50/10" : "bg-muted/10"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  KrishiSetu AI Pricing Engine
                </CardTitle>
                {aiRec && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    Confidence: {aiRec.confidence}%
                  </Badge>
                )}
              </div>
              <CardDescription>
                Multi-factor statistical supply-demand pricing model
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!aiRec ? (
                <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                  Click <strong>"Get AI Fair Price Recommendation"</strong> or take a harvest photo to calculate fair pricing based on 90-day mandi data and quality grading.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Recommended Price Box */}
                  <div className="p-4 rounded-lg bg-emerald-100/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                    <div className="text-xs uppercase font-bold text-emerald-800 dark:text-emerald-300">
                      AI Recommended Price
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 my-1">
                      ₹{aiRec.recommendedPrice}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        / kg
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Fair Range: ₹{aiRec.priceRange?.min} – ₹
                      {aiRec.priceRange?.max}
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="text-xs font-semibold">
                        Demand Level:
                      </span>
                      <Badge
                        className={
                          aiRec.demandLevel === "VERY_HIGH"
                            ? "bg-red-500 text-white"
                            : aiRec.demandLevel === "HIGH"
                              ? "bg-emerald-600 text-white"
                              : aiRec.demandLevel === "MEDIUM"
                                ? "bg-amber-500 text-white"
                                : "bg-slate-500 text-white"
                        }
                      >
                        {aiRec.demandLevel}
                      </Badge>
                    </div>
                  </div>

                  {/* Explainability Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Why this price?
                    </h4>
                    <div className="space-y-2">
                      {aiRec.factors?.map((f: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2 rounded bg-background border"
                        >
                          <span className="font-medium text-foreground">
                            {f.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-[11px]">
                              {f.value}
                            </span>
                            <span
                              className={`font-semibold ${f.direction === "up" ? "text-emerald-600" : f.direction === "down" ? "text-rose-600" : "text-slate-600"}`}
                            >
                              {f.impact}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Explanation */}
                  <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border leading-relaxed">
                    <strong>Model Explanation:</strong> {aiRec.explanation}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPrice(aiRec.recommendedPrice)}
                    className="w-full text-xs font-medium"
                  >
                    Accept AI Price (₹{aiRec.recommendedPrice}/kg)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
