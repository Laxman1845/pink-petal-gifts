import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { CreditCard, Banknote, Smartphone } from "lucide-react";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: { id: string; name: string; price: number; image_url: string | null };
}

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [doorNumber, setDoorNumber] = useState("");
  const [village, setVillage] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, products(id, name, price, image_url)")
      .eq("user_id", user.id);
    if (data) setItems(data as unknown as CartItem[]);
  };

  const total = items.reduce((sum, item) => sum + item.products.price * item.quantity, 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || items.length === 0) return;
    setLoading(true);

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total,
        payment_method: paymentMethod,
        door_number: doorNumber,
        village,
        city,
        state,
        pin_code: pinCode,
        status: "confirmed",
      })
      .select()
      .single();

    if (error || !order) {
      toast.error("Failed to place order");
      setLoading(false);
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.products.name,
      product_image: item.products.image_url || "",
      price: item.products.price,
      quantity: item.quantity,
    }));

    await supabase.from("order_items").insert(orderItems);
    await supabase.from("cart_items").delete().eq("user_id", user.id);

    setLoading(false);
    toast.success("Order placed successfully!");
    navigate("/track-order?orderId=" + order.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-6">Checkout</h1>

        <form onSubmit={handlePlaceOrder} className="space-y-6">
          <div className="bg-card rounded-2xl p-6 shadow-card space-y-4">
            <h2 className="font-display text-xl font-semibold text-foreground">Delivery Address</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Door Number</Label>
                <Input value={doorNumber} onChange={(e) => setDoorNumber(e.target.value)} className="rounded-xl" required />
              </div>
              <div className="space-y-2">
                <Label>Village</Label>
                <Input value={village} onChange={(e) => setVillage(e.target.value)} className="rounded-xl" required />
              </div>
              <div className="space-y-2">
                <Label>Town/City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl" required />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} className="rounded-xl" required />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Pin Code</Label>
                <Input value={pinCode} onChange={(e) => setPinCode(e.target.value)} className="rounded-xl" required maxLength={6} />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-card space-y-4">
            <h2 className="font-display text-xl font-semibold text-foreground">Payment Method</h2>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary cursor-pointer transition-colors">
                <RadioGroupItem value="upi" />
                <Smartphone className="h-5 w-5 text-primary" />
                <span className="font-medium">UPI</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary cursor-pointer transition-colors">
                <RadioGroupItem value="card" />
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="font-medium">Card</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary cursor-pointer transition-colors">
                <RadioGroupItem value="cod" />
                <Banknote className="h-5 w-5 text-primary" />
                <span className="font-medium">Cash on Delivery</span>
              </label>
            </RadioGroup>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-card">
            <div className="flex justify-between text-lg font-bold text-foreground mb-4">
              <span>Order Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading || items.length === 0}>
              {loading ? "Placing Order..." : "Confirm & Pay"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
