// /pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { getEnv } from "@/helpers/getEnv";
import { showToast } from "@/helpers/showToast";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const ProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone must be a 10-digit number"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  dob: z.date().nullable().optional(),
});

const Profile = () => {
  const [user, setUser] = useState(null);
  const [budget, setBudget] = useState(null);
  const [activeTab, setActiveTab] = useState("account");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [countryData, setCountryData] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);

  const form = useForm({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: "",
      phone: "",
      country: "",
      state: "",
      dob: null,
    },
  });

  const { watch, reset, setValue, getValues } = form;
  const watchedCountry = watch("country");

  const fetchCountryStateData = async () => {
    try {
      const res = await fetch(`${getEnv("VITE_API_URL")}/location/locationapi`);
      const data = await res.json();
      if (data.success && data.countries) {
        setCountryData(data.countries);

        const countryList = data.countries
          .map((c) => c.name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        setCountries(countryList);
      }
    } catch (err) {
      console.error("Error fetching countries:", err);
      setCountries([]);
    }
  };

  const fetchStatesLocal = (countryName) => {
    const country = countryData.find((c) => c.name === countryName);
    if (!country) return setStates([]);

    const stateList = country.states
      .map((s) => s.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    setStates(stateList);

    if (getValues("state") && !stateList.includes(getValues("state"))) {
      setValue("state", "");
    }
  };

  useEffect(() => {
    if (watchedCountry) fetchStatesLocal(watchedCountry);
    else setStates([]);
  }, [watchedCountry, countryData]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${getEnv("VITE_API_URL")}/users/me`, { credentials: "include" });
      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        reset({
          name: data.user.name || "",
          phone: data.user.phone || "",
          country: data.user.country || "",
          state: data.user.state || "",
          dob: data.user.dob ? new Date(data.user.dob) : null,
        });
      }
    } catch { }
  };

  const fetchBudget = async () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    try {
      const res = await fetch(`${getEnv("VITE_API_URL")}/budget/me?month=${month}&year=${year}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setBudget(data.budget);
    } catch { }
  };

  useEffect(() => {
    fetchCountryStateData();
    fetchUser();
    fetchBudget();
  }, []);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      const payload = {
        name: values.name,
        phone: values.phone,
        country: values.country,
        state: values.state,
        dob: values.dob ? values.dob.toISOString() : null,
      };

      const res = await fetch(`${getEnv("VITE_API_URL")}/users/update`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        reset({
          name: data.user.name,
          phone: data.user.phone,
          country: data.user.country,
          state: data.user.state,
          dob: data.user.dob ? new Date(data.user.dob) : null,
        });

        if (data.user.country) fetchStatesLocal(data.user.country);
        showToast("success", "Profile updated successfully");
        setIsEditing(true);
      } else {
        showToast("error", data.message || "Update failed");
      }
    } catch {
      showToast("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!user)
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Loading profile...
      </div>
    );

  const goalValue = budget?.totals?.savings || 0;
  const goalTarget = budget?.income || 0;
  const goalPercent = goalTarget ? Math.min((goalValue / goalTarget) * 100, 100) : 0;

  // ------------------ RENDER ------------------
  return (
    <div className="min-h-screen bg-[#0b1324] text-white p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-6">Profile</h1>
      <div className="mb-6">
        <Input
          placeholder="Search profile details..."
          className="bg-[#10192e] border-none text-white placeholder:text-gray-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT SIDEBAR */}
        <Card className="bg-[#10192e] border-none flex flex-col items-center p-6 rounded-2xl">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <h2 className="text-lg font-semibold text-gray-300 text-center">{user.name}</h2>
          <p className="text-sm text-gray-400 text-center">{user.email}</p>

          <Card className="mt-6 w-full bg-[#0d1730] border-none p-4 rounded-2xl">
            <CardHeader className="pb-2">
              <h3 className="text-sm text-gray-300">Financial Goal Progress</h3>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative w-24 h-24 mb-3">
                <Progress value={goalPercent} className="h-4 w-full" />
                <div className="text-center mt-2 font-semibold text-gray-300">
                  {Math.round(goalPercent)}%
                </div>
              </div>
              <p className="text-sm text-center text-gray-400 mt-2">
                You’ve saved ₹{goalValue.toLocaleString()} out of ₹{goalTarget.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </Card>

        {/* RIGHT SIDE */}
        <Card className="col-span-1 md:col-span-2 bg-[#10192e] border-none rounded-2xl p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent border-b border-gray-700 mb-4 w-full">
              <TabsTrigger
                value="account"
                className={`flex-1 mr-4 pb-2 ${activeTab === "account" ? "border-b-2 border-teal-500 text-white" : "text-gray-400"
                  }`}
              >
                Account Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSave)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* NAME */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} className="bg-[#0d1730] border text-gray-300" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* PHONE */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Phone</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} className="bg-[#0d1730] border text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* COUNTRY */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Country</FormLabel>
                        <Select disabled={!isEditing} value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="bg-[#0d1730] text-white">
                            <SelectValue placeholder="Select Country" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1730] text-white max-h-60 overflow-auto">
                            {countries.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* STATE */}
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">State</FormLabel>
                        <Select disabled={!isEditing || !watchedCountry} value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="bg-[#0d1730] text-white">
                            <SelectValue
                              placeholder={watchedCountry ? "Select State" : "Select a country first"}
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1730] text-white max-h-60 overflow-auto">
                            {states.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* DOB */}
                  <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-white">Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button type="button" disabled={!isEditing} variant="outline" className="bg-[#0d1730] text-white border w-full justify-start">
                              <CalendarIcon className="mr-2 h-5 w-5" />
                              {field.value ? format(field.value, "dd MMM yyyy") : "Select Date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-[#0d1730] text-white">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} fromYear={1970} toYear={2030} className="bg-[#0d1730] text-white" />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="hidden md:block" />

                  {/* EDIT / SAVE */}
                  <div className="col-span-1 md:col-span-2">
                    <Button
                      disabled={loading}
                      type={isEditing ? "submit" : "button"}
                      onClick={() => {
                        if (!isEditing) setIsEditing(true);
                      }}
                      className="mt-6 bg-teal-600 hover:bg-teal-700 w-full md:w-auto"
                    >
                      {loading ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
