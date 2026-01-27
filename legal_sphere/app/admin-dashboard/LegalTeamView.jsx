"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Mail, Phone, MapPin } from "lucide-react";

export default function LegalTeamView() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newLawyer, setNewLawyer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialization: "",
    experience: "",
    address: "",
    barNumber: "",
    case_history_summary: ""
  });

  // Fetch lawyers from API
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLawyers();
  }, []);

  const fetchLawyers = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        console.error('No admin token found');
        return;
      }

      const response = await fetch('/api/admin/get-lawyers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json().catch(() => ({}));
      console.log('Fetch lawyers response:', response.status, data);

      if (response.ok) {
        if (data.Success) {
          // Transform data to match frontend structure
          const transformedLawyers = data.Lawyers.map(lawyer => ({
            id: lawyer.id,
            name: lawyer.name,
            email: lawyer.email,
            phone: lawyer.phone || "",
            specialization: lawyer.specialization || "Not specified",
            experience: lawyer.experience || "Not specified",
            status: lawyer.availability === "Available" ? "Active" : "On Leave",
            barNumber: lawyer.barNumber || ""
          }));
          setLawyers(transformedLawyers);
        } else {
          console.error('API returned failure:', data.Message);
        }
      } else {
        console.error('Failed to fetch lawyers:', response.status, data);
      }
    } catch (error) {
      console.error('Error fetching lawyers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLawyer = async () => {
    if (newLawyer.firstName && newLawyer.lastName && newLawyer.email) {
      const fullName = `${newLawyer.firstName} ${newLawyer.lastName}`;
      
      try {
        // Call backend API to create lawyer
        const response = await fetch('/api/admin/create-lawyer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}` // Assuming token is stored in localStorage
          },
          body: JSON.stringify({
            name: fullName,
            email: newLawyer.email,
            password: 'defaultPassword123', // You might want to generate or ask for this
            specialization: newLawyer.specialization,
            experience: newLawyer.experience,
            availability: "Available", // Default to Available
            case_history_summary: newLawyer.case_history_summary,
            phone: newLawyer.phone,
            barNumber: newLawyer.barNumber,
            address: newLawyer.address
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          // Refresh lawyers list after successful creation
          await fetchLawyers();
          
          // Reset form
          setNewLawyer({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            specialization: "",
            experience: "",
            address: "",
            barNumber: "",
            case_history_summary: ""
          });
          setIsAddDialogOpen(false);
          alert('Lawyer created successfully!');
        } else {
          const errorData = await response.json();
          console.error('Failed to create lawyer:', errorData);
          alert(`Failed to create lawyer: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error creating lawyer:', error);
        alert(`Error creating lawyer: ${error.message || 'Network error'}`);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setNewLawyer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Legal Team Management</h3>
          <p className="text-sm text-muted-foreground">Manage your law firm's legal professionals</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Lawyer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] p-8">
            <DialogHeader>
              <DialogTitle>Add New Lawyer</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6 py-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="mb-1.5">First Name</Label>
                    <Input
                      id="firstName"
                      value={newLawyer.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="mb-1.5">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newLawyer.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="mb-1.5">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newLawyer.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="john.doe@legalsphere.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="mb-1.5">Phone</Label>
                  <Input
                    id="phone"
                    value={newLawyer.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="specialization" className="mb-1.5">Specialization</Label>
                    <Select onValueChange={(value) => handleInputChange("specialization", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Corporate Law">Corporate Law</SelectItem>
                        <SelectItem value="Criminal Law">Criminal Law</SelectItem>
                        <SelectItem value="Cyber Law">Cyber Law</SelectItem>
                        <SelectItem value="Family Law">Family Law</SelectItem>
                        <SelectItem value="Immigration Law">Immigration Law</SelectItem>
                        <SelectItem value="Intellectual Property">Intellectual Property</SelectItem>
                        <SelectItem value="Property Law">Property Law</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="ml-2">
                    <Label htmlFor="experience" className="mb-1.5">Experience</Label>
                    <Select onValueChange={(value) => handleInputChange("experience", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-2 years">0-2 years</SelectItem>
                        <SelectItem value="2-5 years">2-5 years</SelectItem>
                        <SelectItem value="5-10 years">5-10 years</SelectItem>
                        <SelectItem value="10+ years">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="barNumber" className="mb-1.5">Bar Number</Label>
                  <Input
                    id="barNumber"
                    value={newLawyer.barNumber}
                    onChange={(e) => handleInputChange("barNumber", e.target.value)}
                    placeholder="BAR123456"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address" className="mb-1.5">Address</Label>
                  <Input
                    id="address"
                    value={newLawyer.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="123 Main St, City, State"
                  />
                </div>
                <div>
                  <Label htmlFor="case_history_summary" className="mb-1.5">Case History Summary</Label>
                  <Textarea
                    id="case_history_summary"
                    value={newLawyer.case_history_summary}
                    onChange={(e) => handleInputChange("case_history_summary", e.target.value)}
                    placeholder="Brief summary of case experience"
                    rows={4}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLawyer}>
                Add Lawyer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lawyers Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-muted-foreground">Loading lawyers...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lawyers.map((lawyer) => (
          <Card key={lawyer.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {lawyer.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial', fontWeight: '600', color: 'var(--foreground)' }}>{lawyer.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{lawyer.specialization}</p>
                  </div>
                </div>
                <Badge variant={lawyer.status === "Active" ? "default" : "secondary"}>
                  {lawyer.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{lawyer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{lawyer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{lawyer.experience} experience</span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Bar: {lawyer.barNumber}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {!loading && lawyers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No lawyers in the system yet</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Lawyer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
