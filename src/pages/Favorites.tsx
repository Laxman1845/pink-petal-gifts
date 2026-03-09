import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Heart } from "lucide-react";

interface FavProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  rating: number;
}

const Favorites = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<FavProduct[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    if (user) fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("favorites")
      .select("product_id, products(id, name, price, image_url, rating)")
      .eq("user_id", user.id);
    if (data) {
      const prods = data.map((f: any) => f.products).filter(Boolean);
      setProducts(prods);
      setFavoriteIds(prods.map((p: any) => p.id));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <h1 className="font-display text-3xl font-bold text-foreground mb-6">Your Favorites</h1>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No favorites yet. Start adding gifts you love!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                isFavorite={favoriteIds.includes(product.id)}
                onFavoriteToggle={fetchFavorites}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
