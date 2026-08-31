import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import api from '@/services/api';

const CATEGORIES = ['All', 'Vegetable', 'Fruit', 'Grain', 'Spice'];
const GRADES = ['All', 'Grade A', 'Grade B', 'Grade C'];
const LOCATIONS = ['All', 'Indore', 'Dewas', 'Bhopal', 'Ujjain', 'Jabalpur', 'Nagpur', 'Jaipur', 'Delhi'];

export default function Marketplace() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [sort, setSort] = useState('recommended');

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedGrade !== 'All') params.quality = selectedGrade;
      if (selectedLocation !== 'All') params.location = selectedLocation;
      if (sort !== 'recommended') params.sort = sort;

      const res = await api.get('/listings', { params });
      setListings(res.data?.listings || res.data || []);
    } catch (error) {
      console.error('Error fetching marketplace listings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchListings(), 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedGrade, selectedLocation, sort]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Direct Agricultural Marketplace</h1>
          <p className="text-muted-foreground text-sm">Farm-fresh produce listed directly by verified farmers and FPOs.</p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap w-full md:w-auto items-center gap-2">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search crops, locations, farmers..."
              className="pl-8 h-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="freshest">Freshest Harvest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filter Sidebar */}
        <aside className="w-full md:w-56 space-y-6 shrink-0">
          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Category</h3>
            <div className="flex flex-wrap md:flex-col gap-1 text-xs">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-left px-3 py-1.5 rounded-lg transition-colors ${selectedCategory === cat ? 'bg-emerald-600 text-white font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Quality Grade</h3>
            <div className="flex flex-wrap md:flex-col gap-1 text-xs">
              {GRADES.map(grade => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`text-left px-3 py-1.5 rounded-lg transition-colors ${selectedGrade === grade ? 'bg-emerald-600 text-white font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Location Cluster</h3>
            <div className="flex flex-wrap md:flex-col gap-1 text-xs max-h-48 overflow-y-auto pr-1">
              {LOCATIONS.map(loc => (
                <button
                  key={loc}
                  onClick={() => setSelectedLocation(loc)}
                  className={`text-left px-3 py-1.5 rounded-lg transition-colors ${selectedLocation === loc ? 'bg-emerald-600 text-white font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="space-y-3 p-4 border rounded-xl">
                  <Skeleton className="h-40 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="p-16 text-center border border-dashed rounded-xl bg-muted/10">
              <h3 className="font-bold text-base mb-1">No Matching Harvests Found</h3>
              <p className="text-xs text-muted-foreground mb-4">Try clearing your filters or searching for another crop.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('All');
                  setSelectedGrade('All');
                  setSelectedLocation('All');
                }}
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(listing => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
