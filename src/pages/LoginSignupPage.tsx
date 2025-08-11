import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { login, signup } from "@/api/auth"; // ✅ backend API
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";

export default function LoginSignupPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (isLogin) {
        res = await login(formData.username, formData.password);
        // alert("Login successful!");
      } else {
        res = await signup(formData.username, formData.password);
        // alert("Signup successful!");
      }

      // ✅ Store user in global context
      setUser({
        user_id: res.user_id,
        username: res.username,
      });

      // ✅ Redirect to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center text-white p-4"
      style={{
        background:
          "radial-gradient(circle at top left, #0e0e1a 0%, #111122 30%, #0a0a14 60%, #050507 100%)",
      }}
    >
      <Card className="w-full max-w-md bg-[#0e0e1a]/80 border border-white/10 shadow-[0_0_25px_rgba(0,0,0,0.4)] rounded-2xl text-white">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold tracking-wide">
            {isLogin ? "Welcome Back" : "Create an Account"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block mb-1 text-sm text-white">Username</label>
              <Input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="bg-[#1a1a2e] border border-white/10 text-white"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block mb-1 text-sm text-white">Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="bg-[#1a1a2e] border border-white/10 text-white pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-[32px] text-gray-400 hover:text-white"
                onClick={() => setShowPassword(prev => !prev)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 shadow-[0_0_12px_rgba(34,197,94,0.7)] text-white"
            >
              {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
            </Button>

            {/* Toggle Login/Signup */}
            <p className="text-center text-sm text-white mt-3">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(prev => !prev)}
                className="text-green-400 hover:underline"
              >
                {isLogin ? "Sign Up" : "Login"}
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
