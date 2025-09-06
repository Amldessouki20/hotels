'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Filter, RotateCcw } from 'lucide-react';
import { applyColors, textStyles, buttonStyles } from '@/lib/colors';

interface Hotel {
  id: string;
  name: string;
  code: string;
}

interface RoomFilters {
  search?: string;
  hotelId?: string;
  roomType?: string;
  boardType?: string;
  minPrice?: number;
  maxPrice?: number;
  minCapacity?: number;
  maxCapacity?: number;
  floor?: number;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  hasAmenities?: string[];
}

interface AdvancedRoomFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: RoomFilters) => void;
  currentFilters: RoomFilters;
}

const boardTypes = [
  { value: 'ROOM_ONLY', label: 'غرفة فقط' },
  { value: 'BED_BREAKFAST', label: 'إفطار' },
  { value: 'HALF_BOARD', label: 'نصف بورد' },
  { value: 'FULL_BOARD', label: 'بورد كامل' },
  { value: 'ALL_INCLUSIVE', label: 'شامل كليًا' }
];

const commonAmenities = [
  { value: 'wifi', label: 'واي فاي' },
  { value: 'parking', label: 'موقف سيارات' },
  { value: 'breakfast', label: 'إفطار' },
  { value: 'gym', label: 'صالة رياضية' },
  { value: 'pool', label: 'مسبح' },
  { value: 'spa', label: 'سبا' },
  { value: 'restaurant', label: 'مطعم' },
  { value: 'room_service', label: 'خدمة الغرف' }
];

export default function AdvancedRoomFilters({ isOpen, onClose, onApplyFilters, currentFilters }: AdvancedRoomFiltersProps) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filters, setFilters] = useState<RoomFilters>(currentFilters);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(currentFilters.hasAmenities || []);

  useEffect(() => {
    if (isOpen) {
      fetchHotels();
      setFilters(currentFilters);
      setSelectedAmenities(currentFilters.hasAmenities || []);
    }
  }, [isOpen, currentFilters]);

  const fetchHotels = async () => {
    try {
      const response = await fetch('/api/hotels');
      if (response.ok) {
        const data = await response.json();
        setHotels(data.hotels || []);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  };

  const handleFilterChange = (field: keyof RoomFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleAmenityToggle = (amenityValue: string) => {
    setSelectedAmenities(prev => {
      const newAmenities = prev.includes(amenityValue)
        ? prev.filter(a => a !== amenityValue)
        : [...prev, amenityValue];
      return newAmenities;
    });
  };

  const handleApplyFilters = () => {
    const finalFilters = {
      ...filters,
      hasAmenities: selectedAmenities.length > 0 ? selectedAmenities : undefined
    };
    onApplyFilters(finalFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters: RoomFilters = {};
    setFilters(resetFilters);
    setSelectedAmenities([]);
    onApplyFilters(resetFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.hotelId) count++;
    if (filters.roomType) count++;
    if (filters.boardType) count++;
    if (filters.minPrice !== undefined) count++;
    if (filters.maxPrice !== undefined) count++;
    if (filters.minCapacity !== undefined) count++;
    if (filters.maxCapacity !== undefined) count++;
    if (filters.floor !== undefined) count++;
    if (filters.isActive !== undefined) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (selectedAmenities.length > 0) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>فلاتر متقدمة للغرف</CardTitle>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFiltersCount()} فلتر نشط
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* البحث والفندق */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">البحث</Label>
              <Input
                id="search"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="البحث في نوع الغرفة أو الوصف"
              />
            </div>

            <div>
              <Label htmlFor="hotelId">الفندق</Label>
              <Select value={filters.hotelId || ''} onValueChange={(value: string) => handleFilterChange('hotelId', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الفنادق" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الفنادق</SelectItem>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.name} ({hotel.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* نوع الغرفة ونوع الإقامة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="roomType">نوع الغرفة</Label>
              <Input
                id="roomType"
                value={filters.roomType || ''}
                onChange={(e) => handleFilterChange('roomType', e.target.value)}
                placeholder="مثال: غرفة مفردة، غرفة مزدوجة"
              />
            </div>

            <div>
              <Label htmlFor="boardType">نوع الإقامة</Label>
              <Select value={filters.boardType || ''} onValueChange={(value: string) => handleFilterChange('boardType', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع أنواع الإقامة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع أنواع الإقامة</SelectItem>
                  {boardTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* نطاق السعر */}
          <div>
            <Label>نطاق السعر</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Input
                  type="number"
                  value={filters.minPrice || ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="الحد الأدنى للسعر"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Input
                  type="number"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="الحد الأقصى للسعر"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* نطاق السعة */}
          <div>
            <Label>نطاق السعة</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Input
                  type="number"
                  value={filters.minCapacity || ''}
                  onChange={(e) => handleFilterChange('minCapacity', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="الحد الأدنى للسعة"
                  min="1"
                />
              </div>
              <div>
                <Input
                  type="number"
                  value={filters.maxCapacity || ''}
                  onChange={(e) => handleFilterChange('maxCapacity', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="الحد الأقصى للسعة"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* الطابق والحالة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="floor">الطابق</Label>
              <Input
                id="floor"
                type="number"
                value={filters.floor || ''}
                onChange={(e) => handleFilterChange('floor', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="رقم الطابق"
                min="0"
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="isActive"
                checked={filters.isActive ?? true}
                onCheckedChange={(checked: boolean) => handleFilterChange('isActive', checked)}
              />
              <Label htmlFor="isActive">الغرف النشطة فقط</Label>
            </div>
          </div>

          {/* نطاق التاريخ */}
          <div>
            <Label>نطاق التاريخ</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* المرافق */}
          <div>
            <Label>المرافق</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {commonAmenities.map((amenity) => (
                <div
                  key={amenity.value}
                  className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                    selectedAmenities.includes(amenity.value)
                      ? `${applyColors.button.primary()} border-amber-600`
                      : `bg-white hover:bg-gray-50 border-gray-300`
                  }`}
                  onClick={() => handleAmenityToggle(amenity.value)}
                >
                  <div className="text-sm font-medium text-center">
                    {amenity.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={handleResetFilters} className={buttonStyles.secondaryOutline}>
              <RotateCcw className="h-4 w-4 mr-2" />
              إعادة تعيين
            </Button>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose} className={buttonStyles.secondaryOutline}>
                إلغاء
              </Button>
              <Button type="button" onClick={handleApplyFilters} className={buttonStyles.primary}>
                تطبيق الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}