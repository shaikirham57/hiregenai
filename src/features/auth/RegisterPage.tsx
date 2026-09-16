import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import type { UserRole } from "@/types";

const schema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const location = useLocation();
  const returnTo = (location.state as { from?: { pathname?: string } })?.from?.pathname;
  const [role, setRole] = useState<UserRole>(returnTo ? "candidate" : "recruiter");
  const { register: registerUser, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await registerUser(values.name, values.email, values.password, role);
      toast({ title: "Account created", description: "Your HireGen AI workspace is ready.", variant: "success" });
      navigate(returnTo || "/dashboard", { replace: true });
    } catch (error) {
      toast({
        title: "Couldn't create account",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  };

  return (
    <div>
      <h1 className="font-display text-h1 font-bold text-heading">Create your account</h1>
      <p className="mt-1.5 text-body-md text-muted">
        {returnTo ? "Create a free account to finish submitting your application." : "Start hiring smarter with HireGen AI."}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <RoleButton icon={Briefcase} label="I'm hiring" active={role === "recruiter"} onClick={() => setRole("recruiter")} />
        <RoleButton icon={User} label="I'm job seeking" active={role === "candidate"} onClick={() => setRole("candidate")} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Jordan Ellis" {...register("name")} />
          <FieldError>{errors.name?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" {...register("email")} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
          <FieldError>{errors.password?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} />
          <FieldError>{errors.confirmPassword?.message}</FieldError>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

function RoleButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof User;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-[13px] font-medium transition-colors",
        active ? "border-primary bg-brand-blue-100 text-primary dark:bg-primary/15" : "border-line-strong text-muted hover:bg-sunken"
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
