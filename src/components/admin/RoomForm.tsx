'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";

interface Hotel {
  id: string;
  name: string;
  code: string;
}

interface RoomFormData {
  hotelId: string;
  roomType: string;
  roomTypeDescription: string;
  altDescription?: string;
  basePrice: number;
  salePrice?: number;
  discountPrice?: number;
  quantity: number;
  boardType: string;
  size?: string;
  capacity: number;
  floor?: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

interface RoomFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoomFormData) => void;
  initialData?: Partial<RoomFormData>;
  isEditing?: boolean;
}

const boardTypes = [
  { value: "ROOM_ONLY", label: "غرفة فقط" },
  { value: "BED_BREAKFAST", label: "إفطار" },
  { value: "HALF_BOARD", label: "نصف بورد" },
  { value: "FULL_BOARD", label: "بورد كامل" },
  { value: "ALL_INCLUSIVE", label: "شامل كليًا" },
];

export default function RoomForm({ isOpen, onClose, onSubmit, initialData, isEditing = false }: RoomFormProps) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [formData, setFormData] = useState<RoomFormData>({
    hotelId: "",
    roomType: "",
    roomTypeDescription: "",
    altDescription: "",
    basePrice: 0,
    salePrice: undefined,
    discountPrice: undefined,
    quantity: 1,
    boardType: "BED_BREAKFAST",
    size: "",
    capacity: 1,
    floor: undefined,
    isActive: true,
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHotels();
      if (initialData) {
        setFormData(prev => ({ ...prev, ...initialData }));
      }
    }
  }, [isOpen, initialData]);

  const fetchHotels = async () => {
    try {
      const response = await fetch("/api/hotels");
      if (response.ok) {
        const data: { hotels: Hotel[] } = await response.json();
        setHotels(data.hotels || []);
      }
    } catch (error) {
      console.error("Error fetching hotels:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
      setFormData({
        hotelId: "",
        roomType: "",
        roomTypeDescription: "",
        altDescription: "",
        basePrice: 0,
        salePrice: undefined,
        discountPrice: undefined,
        quantity: 1,
        boardType: "BED_BREAKFAST",
        size: "",
        capacity: 1,
        floor: undefined,
        isActive: true,
        startDate: "",
        endDate: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  // النوع العام للحقل بناءً على RoomFormData
  const handleInputChange = <K extends keyof RoomFormData>(field: K, value: RoomFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isEditing ? "تعديل غرفة" : "إضافة غرفة جديدة"}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hotel & Room Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hotelId">الفندق *</Label>
                <Select value={formData.hotelId} onValueChange={(value: string) => handleInputChange("hotelId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفندق" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map(hotel => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        {hotel.name} ({hotel.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="roomType">نوع الغرفة *</Label>
                <Input
                  id="roomType"
                  value={formData.roomType}
                  onChange={e => handleInputChange("roomType", e.target.value)}
                  placeholder="مثال: غرفة مفردة، غرفة مزدوجة"
                  required
                />
              </div>
            </div>

            {/* Room Descriptions */}
            <div>
              <Label htmlFor="roomTypeDescription">وصف نوع الغرفة *</Label>
              <Textarea
                id="roomTypeDescription"
                value={formData.roomTypeDescription}
                onChange={e => handleInputChange("roomTypeDescription", e.target.value)}
                placeholder="وصف تفصيلي لنوع الغرفة"
                required
              />
            </div>

            <div>
              <Label htmlFor="altDescription">وصف بديل</Label>
              <Textarea
                id="altDescription"
                value={formData.altDescription || ""}
                onChange={e => handleInputChange("altDescription", e.target.value)}
                placeholder="وصف إضافي أو بديل"
              />
            </div>

            {/* Prices */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="basePrice">السعر الأساسي *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={e => handleInputChange("basePrice", Number(e.target.value))}
                  min={0}
                  step={0.01}
                  required
                />
              </div>

              <div>
                <Label htmlFor="salePrice">سعر البيع</Label>
                <Input
                  id="salePrice"
                  type="number"
                  value={formData.salePrice ?? ""}
                  onChange={e => handleInputChange("salePrice", e.target.value ? Number(e.target.value) : undefined)}
                  min={0}
                  step={0.01}
                />
              </div>

              <div>
                <Label htmlFor="discountPrice">سعر الخصم</Label>
                <Input
                  id="discountPrice"
                  type="number"
                  value={formData.discountPrice ?? ""}
                  onChange={e => handleInputChange("discountPrice", e.target.value ? Number(e.target.value) : undefined)}
                  min={0}
                  step={0.01}
                />
              </div>
            </div>

            {/* Quantity & Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="quantity">الكمية *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={e => handleInputChange("quantity", Number(e.target.value))}
                  min={1}
                  required
                />
              </div>

              <div>
                <Label htmlFor="capacity">السعة *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={e => handleInputChange("capacity", Number(e.target.value))}
                  min={1}
                  required
                />
              </div>

              <div>
                <Label htmlFor="floor">الطابق</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor ?? ""}
                  onChange={e => handleInputChange("floor", e.target.value ? Number(e.target.value) : undefined)}
                  min={0}
                />
              </div>

              <div>
                <Label htmlFor="size">المساحة</Label>
                <Input
                  id="size"
                  value={formData.size ?? ""}
                  onChange={e => handleInputChange("size", e.target.value)}
                  placeholder="مثال: 25 متر مربع"
                />
              </div>
            </div>

            {/* Board Type */}
            <div>
              <Label htmlFor="boardType">نوع الإقامة *</Label>
              <Select value={formData.boardType} onValueChange={(value: string) => handleInputChange("boardType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {boardTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">تاريخ البداية</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate ?? ""}
                  onChange={e => handleInputChange("startDate", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endDate">تاريخ النهاية</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate ?? ""}
                  onChange={e => handleInputChange("endDate", e.target.value)}
                />
              </div>
            </div>

            {/* Active Switch */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked: boolean) => handleInputChange("isActive", checked)}
              />
              <Label htmlFor="isActive">نشط</Label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "جاري الحفظ..." : isEditing ? "تحديث" : "إضافة"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
