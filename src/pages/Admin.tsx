import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Package, ArrowLeft } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  rating: number;
  stock: number;
  category_id: string | null;
  featured: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  payment_method: string;
  city: string | null;
  created_at: string;
}

const Admin = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formRating, setFormRating] = useState("0");
  const [formStock, setFormStock] = useState("0");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
      return;
    }
    fetchProducts();
    fetchCategories();
    fetchOrders();
  }, [isAdmin, authLoading]);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name").order("name");
    if (data) setCategories(data);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("id, status, total, payment_method, city, created_at").order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  const resetForm = () => {
    setFormName("");
    setFormPrice("");
    setFormImageUrl("");
    setFormRating("0");
    setFormStock("0");
    setFormCategoryId("");
    setFormFeatured(false);
    setEditingProduct(null);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormPrice(p.price.toString());
    setFormImageUrl(p.image_url || "");
    setFormRating(p.rating.toString());
    setFormStock(p.stock.toString());
    setFormCategoryId(p.category_id || "");
    setFormFeatured(p.featured);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formName,
      price: parseFloat(formPrice),
      image_url: formImageUrl,
      rating: parseFloat(formRating),
      stock: parseInt(formStock),
      category_id: formCategoryId || null,
      featured: formFeatured,
    };

    if (editingProduct) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id);
      if (error) return toast.error(error.message);
      toast.success("Product updated");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Product added");
    }

    resetForm();
    setShowForm(false);
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast.success("Product deleted");
    fetchProducts();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    toast.success("Order status updated");
    fetchOrders();
  };

  if (authLoading) return null;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button variant={tab === "products" ? "default" : "secondary"} onClick={() => setTab("products")}>Products</Button>
          <Button variant={tab === "orders" ? "default" : "secondary"} onClick={() => setTab("orders")}>Orders</Button>
        </div>

        {tab === "products" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground">{products.length} products</p>
              <Button onClick={() => { resetForm(); setShowForm(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Product
              </Button>
            </div>

            {showForm && (
              <form onSubmit={handleSave} className="bg-card rounded-2xl p-6 shadow-card mb-6 space-y-4">
                <h2 className="font-display text-xl font-semibold">{editingProduct ? "Edit Product" : "Add Product"}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="rounded-xl" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Price (₹)</Label>
                    <Input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="rounded-xl" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <Input type="number" step="0.1" max="5" value={formRating} onChange={(e) => setFormRating(e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} className="rounded-xl" />
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formFeatured} onChange={(e) => setFormFeatured(e.target.checked)} />
                  <span className="text-sm">Featured product</span>
                </label>
                <div className="flex gap-3">
                  <Button type="submit">{editingProduct ? "Update" : "Add"} Product</Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-4 bg-card rounded-2xl p-4 shadow-card">
                  <img src={p.image_url || "/placeholder.svg"} alt={p.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm line-clamp-1">{p.name}</p>
                    <p className="text-xs text-muted-foreground">₹{p.price} • Stock: {p.stock} • ⭐ {p.rating}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteProduct(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-20">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-card rounded-2xl p-4 shadow-card flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-foreground">{order.id.slice(0, 8)}...</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()} • {order.payment_method.toUpperCase()} • {order.city}
                    </p>
                  </div>
                  <span className="font-bold text-foreground">₹{order.total.toLocaleString()}</span>
                  <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.id, v)}>
                    <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
