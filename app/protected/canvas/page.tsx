'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FileText, Search, Trash2, Save, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Spinner } from '@/components/ui/spinner';

interface Document {
  id: string;
  title: string;
  content: any;
  updated_at: string;
  created_by: string;
}

export default function CanvasPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('updated_at', { ascending: false });

    if (data) {
      setDocuments(data);
      if (data.length > 0 && !selectedDoc) {
        setSelectedDoc(data[0]);
      }
    }
    setLoading(false);
  };

  const createDocument = async () => {
    const newDoc = {
      title: 'Untitled Document',
      content: '',
      created_by: user?.id,
    };

    const { data, error } = await supabase.from('documents').insert(newDoc).select().single();

    if (data) {
      setDocuments([data, ...documents]);
      setSelectedDoc(data);
    }
  };

  const saveDocument = async () => {
    if (!selectedDoc) return;
    setSaving(true);
    const { error } = await supabase
      .from('documents')
      .update({
        title: selectedDoc.title,
        content: selectedDoc.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedDoc.id);

    if (!error) {
      setDocuments(documents.map(d => d.id === selectedDoc.id ? selectedDoc : d));
    }
    setSaving(false);
  };

  const deleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (!error) {
      setDocuments(documents.filter(d => d.id !== id));
      if (selectedDoc?.id === id) {
        setSelectedDoc(documents.find(d => d.id !== id) || null);
      }
    }
  };

  const filteredDocs = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4 overflow-hidden">
      {/* Sidebar - Document List */}
      <div className="w-80 flex flex-col gap-4 border-r pr-4 h-full">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Canvas</h1>
          <Button size="sm" onClick={createDocument}>
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedDoc?.id === doc.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedDoc(doc)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="w-4 h-4 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(doc.updated_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem 
                      className="text-destructive" 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDocument(doc.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {filteredDocs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm italic">
                No documents found
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - Editor */}
      <div className="flex-1 flex flex-col bg-card rounded-xl border p-6 overflow-hidden">
        {selectedDoc ? (
          <>
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <input
                className="text-3xl font-bold bg-transparent border-none outline-none w-full focus:ring-0"
                value={selectedDoc.title}
                onChange={(e) => setSelectedDoc({ ...selectedDoc, title: e.target.value })}
                placeholder="Document Title"
              />
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={saveDocument}
                  disabled={saving}
                >
                  {saving ? <Spinner className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <textarea
                className="w-full h-full bg-transparent border-none outline-none resize-none font-serif text-lg leading-relaxed placeholder:text-muted-foreground/50"
                value={selectedDoc.content || ''}
                onChange={(e) => setSelectedDoc({ ...selectedDoc, content: e.target.value })}
                placeholder="Start writing your thoughts here..."
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-lg font-medium">Select a document to edit or create a new one</p>
            <Button variant="link" onClick={createDocument}>
              Create your first document
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
