import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  rating: number;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

const ProductCard = ({ id, name, price, image_url, rating, isFavorite, onFavoriteToggle }: ProductCardProps) => {
  const { user } = useAuth();

  const addToCart = async () => {
    if (!user) return toast.error("Please login first");
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", id)
      .maybeSingle();

    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, product_id: id, quantity: 1 });
    }
    toast.success("Added to cart!");
  };

  const toggleFavorite = async () => {
    if (!user) return toast.error("Please login first");
    if (isFavorite) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", id);
      toast.success("Removed from favorites");
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: id });
      toast.success("Added to favorites!");
    }
    onFavoriteToggle?.();
  };

  return (
    <div className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={image_url || "/placeholder.svg"}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <button
          onClick={toggleFavorite}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : "text-muted-foreground"}`} />
        </button>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-medium text-foreground text-sm line-clamp-2 min-h-[2.5rem]">{name}</h3>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < Math.round(rating) ? "fill-accent text-accent" : "text-muted"}`} />
          ))}
          <span className="text-xs text-muted-foreground ml-1">{rating}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="font-bold text-foreground">₹{price.toLocaleString()}</span>
          <Button size="sm" onClick={addToCart} className="text-xs">
            <ShoppingCart className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
