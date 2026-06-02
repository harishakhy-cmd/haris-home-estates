'use client';

import { useEffect, useState } from 'react';
import { Building2, ImagePlus, Save } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export default function NewListingPage() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');
  const [editId, setEditId] = useState('');
  const [imageLinks, setImageLinks] = useState(['']);
  const [youtubeLinks, setYoutubeLinks] = useState(['']);
  const [amenities, setAmenities] = useState(['']);
  const [facilities, setFacilities] = useState(['']);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, token, hydrate, logout } = useAuthStore();

  useEffect(() => {
    hydrate();
    const params = new URLSearchParams(window.location.search);
    setTitle(params.get('title') ?? '');
    setPrice(params.get('rent') ?? '');
    setCity(params.get('location') ?? '');
    const propertyId = params.get('edit') ?? '';
    setEditId(propertyId);
    if (propertyId) {
      api.get(`/properties/${propertyId}`).then(({ data }) => {
        setTitle(data.title ?? '');
        setPrice(String(data.price ?? ''));
        setCity(data.city ?? '');
        setImageLinks(data.images?.map((image: any) => image.url) ?? ['']);
        setYoutubeLinks(data.youtubeUrls?.length ? data.youtubeUrls : ['']);
        setAmenities(data.amenities?.map((amenity: any) => amenity.name) ?? ['']);
        setFacilities(data.nearbyFacilities?.length ? data.nearbyFacilities : ['']);
      }).catch(() => setNotice('Could not load that property for editing.'));
    }
  }, [hydrate]);

  const updateList = (setter: (items: string[]) => void, items: string[], index: number, value: string) => {
    setter(items.map((item, itemIndex) => itemIndex === index ? value : item));
  };
  const removeListItem = (setter: (items: string[]) => void, items: string[], index: number) => {
    setter(items.length === 1 ? [''] : items.filter((_, itemIndex) => itemIndex !== index));
  };

  if (!token || !user) {
    return (
      <main>
        <Header />
        <section className="mx-auto grid min-h-[calc(100vh-70px)] max-w-lg place-items-center px-4">
          <Card className="space-y-4 p-6 text-center shadow-soft">
            <h1 className="text-2xl font-bold">Landlord access required</h1>
            <p className="text-muted-foreground">Register or sign in as a landlord before creating a listing.</p>
            <a href="/auth?role=LANDLORD" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">Register or sign in</a>
          </Card>
        </section>
      </main>
    );
  }

  if (user.role !== 'LANDLORD') {
    return (
      <main>
        <Header />
        <section className="mx-auto grid min-h-[calc(100vh-70px)] max-w-lg place-items-center px-4">
          <Card className="space-y-4 p-6 text-center shadow-soft">
            <h1 className="text-2xl font-bold">Landlord account required</h1>
            <p className="text-muted-foreground">Only landlords can create rental listings.</p>
            <Button onClick={logout} className="w-full">Sign out</Button>
          </Card>
        </section>
      </main>
    );
  }

  if (!user.landlordApproved) {
    return (
      <main>
        <Header />
        <section className="mx-auto grid min-h-[calc(100vh-70px)] max-w-lg place-items-center px-4">
          <Card className="space-y-4 p-6 text-center shadow-soft">
            <h1 className="text-2xl font-bold">Awaiting admin approval</h1>
            <p className="text-muted-foreground">Admin approval is required before a landlord can publish or edit property listings.</p>
            <Button onClick={logout} className="w-full">Sign out</Button>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground"><Building2 size={20} /></span>
          <div>
            <h1 className="text-3xl font-bold">Create listing</h1>
            <p className="text-muted-foreground">Add the core rental details, then submit for admin review.</p>
          </div>
        </div>
        {notice && <div className={`mb-5 rounded-md border px-4 py-3 text-sm ${notice.startsWith('Error') ? 'border-destructive bg-destructive/10 text-destructive' : 'border-green-500 bg-green-500/10 text-green-700'}`}>{notice}</div>}
        <Card
          as="form"
          className="grid gap-4 p-5"
          onSubmit={async (event: any) => {
            event.preventDefault();
            if (!title || !price || !city) return setNotice('Error: Title, rent price, and city are required.');
            
            setLoading(true);
            const form = new FormData(event.currentTarget);
            
            const bedroomsValue = form.get('bedrooms');
            const bathroomsValue = form.get('bathrooms');
            
            const payload = {
              title: title.trim(),
              price: parseFloat(price),
              city: city.trim(),
              description: String(form.get('description')).trim(),
              propertyType: String(form.get('propertyType')),
              bedrooms: bedroomsValue ? parseInt(String(bedroomsValue)) : 0,
              bathrooms: bathroomsValue ? parseInt(String(bathroomsValue)) : 0,
              address: String(form.get('address')).trim(),
              imageUrls: imageLinks.filter(Boolean),
              youtubeUrls: youtubeLinks.filter(Boolean),
              amenityNames: amenities.filter(Boolean),
              nearbyFacilities: facilities.filter(Boolean),
            };
            
            try {
              if (editId) {
                await api.patch(`/properties/${editId}`, payload);
                setNotice('Success: Listing updated successfully!');
              } else {
                await api.post('/properties', payload);
                setNotice('Success: Listing submitted for admin review!');
              }
              setTimeout(() => {
                window.location.href = '/dashboard/landlord';
              }, 1500);
            } catch (error: any) {
              const status = error?.response?.status;
              const errorMsg = error?.response?.data?.message || error?.message || 'Connection failed';
              
              if (status === 401) {
                setNotice('Error: Unauthorized. Please sign in again.');
              } else if (status === 403) {
                setNotice('Error: Admin approval required. Contact support.');
              } else if (status >= 500) {
                setNotice('Error: Server error. Please try again later or check if backend is running.');
              } else if (status >= 400) {
                setNotice(`Error: ${errorMsg}`);
              } else {
                setNotice(`Error: ${errorMsg}. Ensure backend is running at http://localhost:3001/api/v1`);
              }
              console.error('Property creation error:', error);
            } finally {
              setLoading(false);
            }
          }}
        >
          <Input 
            value={title} 
            onChange={(event) => setTitle(event.target.value)} 
            placeholder="Property title" 
            required
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input 
              value={price} 
              onChange={(event) => setPrice(event.target.value)} 
              inputMode="numeric" 
              placeholder="Monthly rent" 
              required
            />
            <Input 
              value={city} 
              onChange={(event) => setCity(event.target.value)} 
              placeholder="City" 
              required
            />
          </div>
          <Input name="address" placeholder="Street address or area" />
          <div className="grid gap-4 md:grid-cols-3">
            <select name="propertyType" className="h-11 rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30">
              <option value="APARTMENT">Apartment</option>
              <option value="HOUSE">House</option>
              <option value="HOSTEL">Hostel</option>
              <option value="OFFICE">Office</option>
              <option value="SHOP">Shop</option>
              <option value="STUDIO">Studio</option>
              <option value="TOWNHOUSE">Townhouse</option>
              <option value="VILLA">Villa</option>
            </select>
            <Input name="bedrooms" type="number" min="0" placeholder="Bedrooms" />
            <Input name="bathrooms" type="number" min="0" placeholder="Bathrooms" />
          </div>
          <textarea name="description" className="min-h-32 rounded-md border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Describe the property, lease terms, facilities, and nearby services" />
          <div className="space-y-3 rounded-md border border-dashed border-border p-4">
            <div className="flex items-center gap-2 font-semibold"><ImagePlus size={18} /> Google Drive photo links</div>
            {imageLinks.map((url, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-[1fr_100px]">
                <Input value={url} onChange={(event) => updateList(setImageLinks, imageLinks, index, event.target.value)} placeholder="https://drive.google.com/file/d/.../view" />
                <Button type="button" className="bg-card text-foreground ring-1 ring-border" onClick={() => removeListItem(setImageLinks, imageLinks, index)}>Remove</Button>
              </div>
            ))}
            <Button type="button" className="bg-card text-foreground ring-1 ring-border" onClick={() => setImageLinks([...imageLinks, ''])}>Add photo link</Button>
          </div>
          <div className="space-y-3 rounded-md border border-border p-4">
            <h2 className="font-semibold">YouTube video links</h2>
            {youtubeLinks.map((url, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-[1fr_100px]">
                <Input value={url} onChange={(event) => updateList(setYoutubeLinks, youtubeLinks, index, event.target.value)} placeholder="https://youtube.com/watch?v=..." />
                <Button type="button" className="bg-card text-foreground ring-1 ring-border" onClick={() => removeListItem(setYoutubeLinks, youtubeLinks, index)}>Remove</Button>
              </div>
            ))}
            <Button type="button" className="bg-card text-foreground ring-1 ring-border" onClick={() => setYoutubeLinks([...youtubeLinks, ''])}>Add video link</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-md border border-border p-4">
              <h2 className="font-semibold">Amenities</h2>
              {amenities.map((name, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-[1fr_100px]">
                  <Input value={name} onChange={(event) => updateList(setAmenities, amenities, index, event.target.value)} placeholder="WiFi, parking, security" />
                  <Button type="button" className="bg-card text-foreground ring-1 ring-border" onClick={() => removeListItem(setAmenities, amenities, index)}>Remove</Button>
                </div>
              ))}
              <Button type="button" className="bg-card text-foreground ring-1 ring-border" onClick={() => setAmenities([...amenities, ''])}>Add amenity</Button>
            </div>
            <div className="space-y-3 rounded-md border border-border p-4">
              <h2 className="font-semibold">Nearby facilities</h2>
              {facilities.map((name, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-[1fr_100px]">
                  <Input value={name} onChange={(event) => updateList(setFacilities, facilities, index, event.target.value)} placeholder="Clinic, school, taxi stage" />
                  <Button type="button" className="bg-card text-foreground ring-1 ring-border" onClick={() => removeListItem(setFacilities, facilities, index)}>Remove</Button>
                </div>
              ))}
              <Button type="button" className="bg-card text-foreground ring-1 ring-border" onClick={() => setFacilities([...facilities, ''])}>Add facility</Button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full"><Save size={17} /> {loading ? 'Submitting...' : (editId ? 'Update listing' : 'Save listing')}</Button>
        </Card>
      </section>
    </main>
  );
}
