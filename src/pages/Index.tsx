import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Truck, Gift, Sparkles } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  rating: number;
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) {
      fetchFeatured();
      fetchFavorites();
    }
  }, [user, authLoading]);

  const fetchFeatured = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, price, image_url, rating")
      .order("rating", { ascending: false })
      .limit(8);
    if (data) setFeaturedProducts(data);
  };

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase.from("favorites").select("product_id").eq("user_id", user.id);
    if (data) setFavoriteIds(data.map((f) => f.product_id));
  };

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Gift className="h-8 w-8 text-primary animate-pulse" /></div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="Gift Shopping" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 to-foreground/20" />
        </div>
        <div className="relative container mx-auto py-20 md:py-32 px-4">
          <div className="max-w-lg space-y-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider">Premium Gifts</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
              Find the Perfect Gift
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              Discover curated gifts for every occasion — from weddings to birthdays, make every moment special.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" size="lg" onClick={() => navigate("/shop")}>
                <ShoppingBag className="h-5 w-5 mr-2" /> Shop Now
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/track-order")} className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground rounded-full">
                <Truck className="h-5 w-5 mr-2" /> Track Order
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto py-16 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Featured Products</h2>
            <p className="text-muted-foreground mt-1">Top-rated gifts loved by our customers</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/shop")}>View All</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              isFavorite={favoriteIds.includes(product.id)}
              onFavoriteToggle={fetchFavorites}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
