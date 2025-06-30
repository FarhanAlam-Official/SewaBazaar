"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Award,
  Download,
  Eye,
  Trash2,
  Plus
} from "lucide-react"

export default function DocumentsAndVerification() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Documents & Verification</h1>
          <p className="text-muted-foreground">Manage your licenses and certifications</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Verification Status */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Verification Status</p>
              <h3 className="text-2xl font-bold">Verified</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
              <h3 className="text-2xl font-bold">8</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Certifications</p>
              <h3 className="text-2xl font-bold">3</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <h3 className="text-2xl font-bold">1</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Required Documents */}
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-xl font-semibold mb-4">Required Documents</h2>
          <div className="space-y-4">
            {/* Document Item */}
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Business License</h3>
                  <p className="text-sm text-muted-foreground">Valid until Dec 2024</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Verified
                    </Badge>
                    <span className="text-sm text-muted-foreground">Uploaded on Jan 15, 2024</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Insurance Certificate</h3>
                  <p className="text-sm text-muted-foreground">Valid until Nov 2024</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Verified
                    </Badge>
                    <span className="text-sm text-muted-foreground">Uploaded on Jan 10, 2024</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Professional Certification</h3>
                  <p className="text-sm text-muted-foreground">Cleaning Services Level 2</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="warning" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Under Review
                    </Badge>
                    <span className="text-sm text-muted-foreground">Uploaded on Mar 10, 2024</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Verification Progress */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Verification Progress</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">90%</span>
              </div>
              <Progress value={90} className="h-2" />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Required Documents</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Business Documents</span>
                    <span className="text-muted-foreground">3/3</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Personal Documents</span>
                    <span className="text-muted-foreground">2/2</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Certifications</span>
                    <span className="text-muted-foreground">2/3</span>
                  </div>
                  <Progress value={66} className="h-2" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Verification Steps</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Identity Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Business Registration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Insurance Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Professional Certification</span>
                </div>
              </div>
            </div>

            <Button className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Upload Missing Documents
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
} 