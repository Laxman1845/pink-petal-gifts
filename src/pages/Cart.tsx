import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
}

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, products(id, name, price, image_url)")
      .eq("user_id", user.id);
    if (data) setItems(data as unknown as CartItem[]);
    setLoading(false);
  };

  const updateQuantity = async (id: string, newQty: number) => {
    if (newQty < 1) return removeItem(id);
    await supabase.from("cart_items").update({ quantity: newQty }).eq("id", id);
    fetchCart();
  };

  const removeItem = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    toast.success("Removed from cart");
    fetchCart();
  };

  const total = items.reduce((sum, item) => sum + item.products.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-6">Your Cart</h1>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => navigate("/shop")}>Shop Now</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 bg-card rounded-2xl p-4 shadow-card items-center">
                <img
                  src={item.products.image_url || "/placeholder.svg"}
                  alt={item.products.name}
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground text-sm line-clamp-1">{item.products.name}</h3>
                  <p className="text-primary font-bold mt-1">₹{item.products.price.toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-foreground">₹{(item.products.price * item.quantity).toLocaleString()}</p>
                  <Button variant="ghost" size="icon" className="mt-2 text-destructive" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="bg-card rounded-2xl p-6 shadow-card mt-6">
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
              <Button className="w-full mt-4" size="lg" onClick={() => navigate("/checkout")}>
                Place Order
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
