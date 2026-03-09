import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, CheckCircle2, Truck, MapPin, Clock } from "lucide-react";

interface Order {
  id: string;
  status: string;
  total: number;
  payment_method: string;
  city: string | null;
  state: string | null;
  created_at: string;
}

const statusSteps = ["confirmed", "shipped", "delivered"];
const statusIcons: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle2,
  shipped: Truck,
  delivered: MapPin,
};

const TrackOrder = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("orderId") || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (searchParams.get("orderId")) {
      handleTrack();
    }
  }, []);

  const handleTrack = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!orderId.trim()) return;
    setNotFound(false);
    const { data } = await supabase
      .from("orders")
      .select("id, status, total, payment_method, city, state, created_at")
      .eq("id", orderId.trim())
      .maybeSingle();
    if (data) {
      setOrder(data);
    } else {
      setOrder(null);
      setNotFound(true);
    }
  };

  const currentStep = order ? statusSteps.indexOf(order.status) : -1;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-6">Track Your Order</h1>

        <form onSubmit={handleTrack} className="bg-card rounded-2xl p-6 shadow-card mb-8">
          <Label className="mb-2 block">Order ID</Label>
          <div className="flex gap-3">
            <Input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter your order ID"
              className="rounded-xl flex-1"
            />
            <Button type="submit">Track</Button>
          </div>
        </form>

        {notFound && (
          <div className="text-center py-12 bg-card rounded-2xl shadow-card">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Order not found. Please check your order ID.</p>
          </div>
        )}

        {order && (
          <div className="bg-card rounded-2xl p-6 shadow-card space-y-6 animate-fade-in">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono text-sm text-foreground">{order.id.slice(0, 8)}...</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-bold text-foreground">₹{order.total.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Payment: {order.payment_method.toUpperCase()}</p>
              <p className="text-sm text-muted-foreground">
                Placed on: {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            {/* Progress tracker */}
            <div className="pt-4">
              <div className="flex items-center justify-between">
                {statusSteps.map((step, i) => {
                  const Icon = statusIcons[step] || Package;
                  const isActive = i <= currentStep;
                  return (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-xs mt-2 capitalize ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>{step}</span>
                      {i < statusSteps.length - 1 && (
                        <div className={`hidden`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex mt-2">
                {statusSteps.slice(0, -1).map((_, i) => (
                  <div key={i} className="flex-1 px-6">
                    <div className={`h-1 rounded-full ${i < currentStep ? "bg-primary" : "bg-secondary"}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Show user's orders */}
        {user && !order && !notFound && <UserOrders userId={user.id} onSelect={setOrderId} />}
      </div>
    </div>
  );
};

const UserOrders = ({ userId, onSelect }: { userId: string; onSelect: (id: string) => void }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, status, total, payment_method, city, state, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setOrders(data);
  };

  if (orders.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-foreground">Your Recent Orders</h2>
      {orders.map((order) => (
        <button
          key={order.id}
          onClick={() => onSelect(order.id)}
          className="w-full text-left bg-card rounded-2xl p-4 shadow-card hover:shadow-hover transition-all flex justify-between items-center"
        >
          <div>
            <p className="font-mono text-sm text-foreground">{order.id.slice(0, 8)}...</p>
            <p className="text-xs text-muted-foreground capitalize">{order.status} • {new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <span className="font-bold text-foreground">₹{order.total.toLocaleString()}</span>
        </button>
      ))}
    </div>
  );
};

export default TrackOrder;
