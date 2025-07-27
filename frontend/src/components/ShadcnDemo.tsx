import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ShadcnDemo: React.FC = () => {
  const [status, setStatus] = useState('active');

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Shadcn/ui Transformation Demo</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* OLD WAY */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-red-600">❌ Before: Manual Styling</h2>
          
          {/* Old Card */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Project Alpha</h3>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                Active
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-3">A sample project description</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Cost:</span>
                <div className="font-medium">$15,000</div>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <div className="font-medium">In Progress</div>
              </div>
            </div>
          </div>

          {/* Old Form */}
          <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Old Form Style</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label htmlFor="old-status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select id="old-status" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Active</option>
                  <option>Completed</option>
                </select>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Submit
              </button>
            </div>
          </div>
        </div>

        {/* NEW WAY */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-green-600">✅ After: Shadcn/ui Components</h2>
          
          {/* New Card */}
          <Card className="hover:shadow-lg transition-all hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Project Alpha</CardTitle>
                <Badge variant="default">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground">A sample project description</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Cost</span>
                  <div className="font-semibold text-lg">$15,000</div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Status</span>
                  <div className="font-medium">In Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Form */}
          <Card>
            <CardHeader>
              <CardTitle>Modern Form Style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input 
                  id="project-name"
                  placeholder="Enter project name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-select">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">Submit</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Interactive Examples */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">Interactive Components</h2>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>

        <div className="flex justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Beautiful Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Shadcn/ui Dialog</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  This is a beautiful, accessible dialog built with Radix UI primitives and styled with Tailwind CSS.
                </p>
                <Alert>
                  <AlertDescription>
                    This alert component is also part of the shadcn/ui library!
                  </AlertDescription>
                </Alert>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ShadcnDemo; 