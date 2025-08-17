import { useState } from 'react';
import { useAuthState, useAuth } from '@campnetwork/origin/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  ArrowUpOnSquareIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  TagIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  SparklesIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

interface IPFormData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: string;
  pricingModel: 'fixed' | 'auction' | 'negotiable';
  files: File[];
  licenseType: string;
  exclusivity: 'exclusive' | 'non-exclusive';
  territory: string;
  duration: string;
  royaltyBps: number;
  parentId?: string;
}

const categories = [
  'AI/ML', 'Blockchain', 'Smart Contracts', 'DeFi', 'NFT', 'Gaming', 
  'Mobile Apps', 'Web Development', 'APIs', 'Algorithms', 'Data Science',
  'IoT', 'Cybersecurity', 'AR/VR', 'Design', 'Music', 'Art', 'Writing', 'Other'
];

const licenseTypes = [
  'Standard License',
  'Extended License', 
  'Commercial License',
  'Royalty-Free License',
  'Creative Commons',
  'Custom License'
];

export default function CreateIPOrigin() {
  const { authenticated } = useAuthState();
  const { origin, jwt } = useAuth();
  
  const [formData, setFormData] = useState<IPFormData>({
    title: '',
    description: '',
    category: '',
    tags: [],
    price: '0.1',
    pricingModel: 'fixed',
    files: [],
    licenseType: '',
    exclusivity: 'non-exclusive',
    territory: 'worldwide',
    duration: 'perpetual',
    royaltyBps: 500, // 5%
    parentId: undefined
  });

  const [currentTag, setCurrentTag] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <ShieldCheckIcon className="w-6 h-6 text-orange-500" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              Please connect your wallet to create IP assets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = '/'}>
              Go to Home Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (field: keyof IPFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      handleInputChange('tags', [...formData.tags, currentTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileUpload = (files: FileList) => {
    const fileArray = Array.from(files);
    handleInputChange('files', [...formData.files, ...fileArray]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    handleInputChange('files', formData.files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!origin || !jwt) {
      alert('Please ensure you are authenticated with Origin SDK');
      return;
    }

    if (formData.files.length === 0) {
      alert('Please upload at least one file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Prepare license terms
      const licenseTerms = {
        price: BigInt(Math.floor(parseFloat(formData.price) * 1e18)), // Convert to wei
        duration: formData.duration === 'perpetual' ? 0n : BigInt(365 * 24 * 3600), // 1 year in seconds
        royaltyBps: formData.royaltyBps,
        paymentToken: '0x0000000000000000000000000000000000000000', // ETH
      };

      // Prepare metadata
      const metadata = {
        name: formData.title,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        licenseType: formData.licenseType,
        exclusivity: formData.exclusivity,
        territory: formData.territory,
        duration: formData.duration,
        creator: 'user', // This would be dynamic based on authenticated user
        createdAt: new Date().toISOString(),
      };

      // Use the first file for minting (in a real app, you might zip multiple files)
      const primaryFile = formData.files[0];
      
      const parentId = formData.parentId ? BigInt(formData.parentId) : undefined;

      setUploadProgress(25);

      // Mint the IP NFT using Origin SDK
      const tokenId = await origin.mintFile(
        primaryFile,
        metadata,
        licenseTerms,
        parentId,
        {
          progressCallback: (percent: number) => {
            setUploadProgress(25 + (percent * 0.75)); // 25% base + 75% for upload
          }
        }
      );

      setUploadProgress(100);
      setMintedTokenId(tokenId);
      
      // Show success message
      alert(`IP NFT minted successfully! Token ID: ${tokenId}`);
      
    } catch (error) {
      console.error('Error minting IP NFT:', error);
      alert(`Error minting IP NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (mintedTokenId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-green-600">
              <SparklesIcon className="w-8 h-8" />
              IP NFT Created Successfully!
            </CardTitle>
            <CardDescription>
              Your intellectual property has been minted as an NFT on the Camp Network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-800">
                <strong>Token ID:</strong> {mintedTokenId}
              </div>
              <div className="text-sm text-green-600 mt-1">
                Your IP is now live on the marketplace and ready for licensing!
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.href = '/marketplace'}>
                View in Marketplace
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/my-ips'}>
                My IPs
              </Button>
              <Button variant="outline" onClick={() => {
                setMintedTokenId(null);
                setFormData({
                  title: '',
                  description: '',
                  category: '',
                  tags: [],
                  price: '0.1',
                  pricingModel: 'fixed',
                  files: [],
                  licenseType: '',
                  exclusivity: 'non-exclusive',
                  territory: 'worldwide',
                  duration: 'perpetual',
                  royaltyBps: 500,
                  parentId: undefined
                });
              }}>
                Create Another IP
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your IP Asset
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your intellectual property into a tradeable NFT on the Camp Network
          </p>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <SparklesIcon className="w-5 h-5 text-orange-500 animate-spin" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-orange-800">Creating IP NFT...</span>
                    <span className="text-sm text-orange-600">{uploadProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-orange-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="files">Files & Media</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="licensing">Licensing</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Provide the essential details about your intellectual property
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">IP Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter a descriptive title for your IP"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <textarea
                      id="description"
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Detailed description of your intellectual property, its features, and potential use cases..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <select
                        id="category"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="parentId">Parent IP (Optional)</Label>
                      <Input
                        id="parentId"
                        placeholder="Enter parent token ID if this is derivative"
                        value={formData.parentId || ''}
                        onChange={(e) => handleInputChange('parentId', e.target.value || undefined)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        placeholder="Add tags to help others discover your IP"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} variant="outline">
                        <TagIcon className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Files & Media */}
            <TabsContent value="files">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpOnSquareIcon className="w-5 h-5" />
                    Files & Media
                  </CardTitle>
                  <CardDescription>
                    Upload files, documentation, and media related to your IP
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-300 hover:border-orange-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">
                      Drag and drop files here, or click to select
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Supported formats: PDF, DOC, ZIP, images, videos (Max 100MB)
                    </p>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      id="file-upload"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    />
                    <label htmlFor="file-upload">
                      <Button type="button" variant="outline" className="cursor-pointer">
                        Select Files
                      </Button>
                    </label>
                  </div>

                  {formData.files.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Files:</Label>
                      <div className="space-y-2">
                        {formData.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing */}
            <TabsContent value="pricing">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CurrencyDollarIcon className="w-5 h-5" />
                    Pricing Strategy
                  </CardTitle>
                  <CardDescription>
                    Set your pricing model and terms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Pricing Model *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { value: 'fixed', label: 'Fixed Price', desc: 'Set a fixed licensing fee' },
                        { value: 'auction', label: 'Auction', desc: 'Let buyers bid on your IP' },
                        { value: 'negotiable', label: 'Negotiable', desc: 'Open to price discussions' }
                      ].map((option) => (
                        <div
                          key={option.value}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            formData.pricingModel === option.value
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-orange-300'
                          }`}
                          onClick={() => handleInputChange('pricingModel', option.value)}
                        >
                          <h3 className="font-medium">{option.label}</h3>
                          <p className="text-sm text-gray-500">{option.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(formData.pricingModel === 'fixed' || formData.pricingModel === 'auction') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">
                          {formData.pricingModel === 'auction' ? 'Starting Price *' : 'Price *'}
                        </Label>
                        <div className="relative">
                          <Input
                            id="price"
                            type="number"
                            step="0.001"
                            placeholder="0.00"
                            value={formData.price}
                            onChange={(e) => handleInputChange('price', e.target.value)}
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            CAMP
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="royaltyBps">Royalty Percentage</Label>
                        <div className="relative">
                          <Input
                            id="royaltyBps"
                            type="number"
                            min="0"
                            max="50"
                            step="0.1"
                            value={formData.royaltyBps / 100}
                            onChange={(e) => handleInputChange('royaltyBps', Math.round(parseFloat(e.target.value) * 100))}
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            %
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Royalty earned on secondary sales (0-50%)
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Licensing */}
            <TabsContent value="licensing">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5" />
                    Licensing Terms
                  </CardTitle>
                  <CardDescription>
                    Define how your IP can be used
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="licenseType">License Type *</Label>
                    <select
                      id="licenseType"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={formData.licenseType}
                      onChange={(e) => handleInputChange('licenseType', e.target.value)}
                      required
                    >
                      <option value="">Select license type</option>
                      {licenseTypes.map(license => (
                        <option key={license} value={license}>{license}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Exclusivity</Label>
                      <div className="space-y-2">
                        {[
                          { value: 'exclusive', label: 'Exclusive', desc: 'Only one licensee allowed' },
                          { value: 'non-exclusive', label: 'Non-exclusive', desc: 'Multiple licensees allowed' }
                        ].map((option) => (
                          <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              name="exclusivity"
                              value={option.value}
                              checked={formData.exclusivity === option.value}
                              onChange={(e) => handleInputChange('exclusivity', e.target.value)}
                              className="mt-1 text-orange-500 focus:ring-orange-500"
                            />
                            <div>
                              <p className="font-medium">{option.label}</p>
                              <p className="text-sm text-gray-500">{option.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="territory">Territory</Label>
                        <select
                          id="territory"
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          value={formData.territory}
                          onChange={(e) => handleInputChange('territory', e.target.value)}
                        >
                          <option value="worldwide">Worldwide</option>
                          <option value="north-america">North America</option>
                          <option value="europe">Europe</option>
                          <option value="asia">Asia</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration</Label>
                        <select
                          id="duration"
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          value={formData.duration}
                          onChange={(e) => handleInputChange('duration', e.target.value)}
                        >
                          <option value="perpetual">Perpetual</option>
                          <option value="1-year">1 Year</option>
                          <option value="2-years">2 Years</option>
                          <option value="5-years">5 Years</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Legal Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Origin SDK Integration</p>
                  <p>
                    Your IP will be minted as an NFT using the Origin Protocol on Camp Network. 
                    All metadata will be stored on IPFS/Filecoin with on-chain licensing terms 
                    enforced by smart contracts. You confirm ownership and authority to license this IP.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button 
              type="submit" 
              size="lg" 
              className="px-12"
              disabled={
                !formData.title || 
                !formData.description || 
                !formData.category || 
                formData.files.length === 0 ||
                isUploading
              }
            >
              {isUploading ? (
                <>
                  <SparklesIcon className="w-5 h-5 mr-2 animate-spin" />
                  Creating IP NFT...
                </>
              ) : (
                <>
                  <GlobeAltIcon className="w-5 h-5 mr-2" />
                  Create IP Asset
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
