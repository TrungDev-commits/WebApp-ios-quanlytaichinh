import {
  Utensils, Car, ShoppingBag, Zap, Banknote, Tag,
  Coffee, Home, Heart, Dumbbell, Book, Music, Tv,
  Smartphone, Monitor, Gift, Plane, Hotel, Train, Bus,
  Bike, Fuel, Hospital, Pill, Shirt, Watch, Gem, Crown,
  Star, Sun, Moon, Cloud, Umbrella, Leaf, Flame, Droplet,
  Snowflake, Headphones, Camera, Film, MessageCircle,
  Phone, Mail, MapPin, Compass, Globe, Clock, Bell,
  Shield, Key, Wrench, Settings, User, Briefcase,
  GraduationCap, Flower, Scissors, Printer, Building,
  Store, Palette, TreePine, PawPrint, Gamepad2, CableCar,
  Tent, Sailboat, Castle, Rocket, Lightbulb, Wine,
  CakeSlice, Pizza, Apple, Snowflake as SnowflakeIcon,
  type LucideIcon
} from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  Utensils, Car, ShoppingBag, Zap, Banknote, Tag,
  Coffee, Home, Heart, Dumbbell, Book, Music, Tv,
  Smartphone, Monitor, Gift, Plane, Hotel, Train, Bus,
  Bike, Fuel, Hospital, Pill, Shirt, Watch, Gem, Crown,
  Star, Sun, Moon, Cloud, Umbrella, Leaf, Flame, Droplet,
  Snowflake: SnowflakeIcon, Headphones, Camera, Film, MessageCircle,
  Phone, Mail, MapPin, Compass, Globe, Clock, Bell,
  Shield, Key, Wrench, Settings, User, Briefcase,
  GraduationCap, Flower, Scissors, Printer, Building,
  Store, Palette, TreePine, PawPrint, Gamepad2, CableCar,
  Tent, Sailboat, Castle, Rocket, Lightbulb, Wine,
  CakeSlice, Pizza, Apple,
};

export const iconNames = Object.keys(iconMap);
