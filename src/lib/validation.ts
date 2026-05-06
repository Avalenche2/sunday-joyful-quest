import { z } from "zod";

const strongPassword = z
  .string()
  .min(8, "Mot de passe : 8 caractères minimum")
  .max(72, "Mot de passe trop long")
  .regex(/[A-Z]/, "Doit contenir une majuscule")
  .regex(/[a-z]/, "Doit contenir une minuscule")
  .regex(/[0-9]/, "Doit contenir un chiffre");

export const signUpSchema = z
  .object({
    firstName: z.string().trim().min(1, "Prénom requis").max(50, "Prénom trop long"),
    lastName: z.string().trim().min(1, "Nom requis").max(50, "Nom trop long"),
    age: z
      .number({ message: "Âge requis" })
      .int()
      .min(4, "Âge minimum : 4 ans")
      .max(18, "Âge maximum : 18 ans"),
    parentFirstName: z
      .string()
      .trim()
      .min(1, "Prénom du parent requis")
      .max(50, "Prénom du parent trop long"),
    parentLastName: z
      .string()
      .trim()
      .min(1, "Nom du parent requis")
      .max(50, "Nom du parent trop long"),
    parentPhone: z
      .string()
      .trim()
      .min(6, "Numéro trop court")
      .max(20, "Numéro trop long")
      .regex(/^[0-9+\s().-]+$/, "Numéro invalide"),
    email: z.string().trim().email("Email invalide").max(255),
    password: strongPassword,
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email: z.string().trim().email("Email invalide").max(255),
  password: z.string().min(1, "Mot de passe requis").max(72),
});

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(50, "Prénom trop long"),
  lastName: z.string().trim().min(1, "Nom requis").max(50, "Nom trop long"),
  age: z
    .number({ message: "Âge requis" })
    .int()
    .min(4, "Âge minimum : 4 ans")
    .max(18, "Âge maximum : 18 ans"),
});

export const adminSignUpSchema = z
  .object({
    firstName: z.string().trim().min(1, "Prénom requis").max(50, "Prénom trop long"),
    lastName: z.string().trim().min(1, "Nom requis").max(50, "Nom trop long"),
    email: z.string().trim().email("Email invalide").max(255),
    password: strongPassword,
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type AdminSignUpInput = z.infer<typeof adminSignUpSchema>;
