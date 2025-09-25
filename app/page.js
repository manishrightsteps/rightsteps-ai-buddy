'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Volume2, VolumeX, MessageSquare } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [question, setQuestion] = useState('');
  const [explanation, setExplanation] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setAnalysis(result.analysis);
        setOriginalContent(result.originalContent);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExplain = async (isQuestion = false) => {
    if (!originalContent) return;

    setIsExplaining(true);
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: originalContent,
          question: isQuestion ? question : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setExplanation(result.explanation);
        if (isQuestion) {
          setQuestion('');
        }
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Explanation failed: ' + error.message);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleSpeak = (text) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-5xl font-bold text-green-600 mb-4">RightSteps AI Buddy</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Upload your documents and get AI-powered explanations with voice support</p>
          <div className="w-24 h-1 bg-green-600 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Upload size={24} />
              Upload Document
            </CardTitle>
            <CardDescription>
              Upload a markdown (.md) or text (.txt) file to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".md,.txt"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="flex-1"
              />
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isUploading ? 'Uploading...' : 'Upload & Analyze'}
              </Button>
            </div>

            {file && (
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span className="text-sm text-gray-600">{file.name}</span>
                <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
              </div>
            )}

            {isUploading && <Progress value={50} className="w-full" />}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-green-600">Document Analysis</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSpeak(analysis)}
                  className="flex items-center gap-2"
                >
                  {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  {isSpeaking ? 'Stop' : 'Listen'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-none">
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div
                    className="text-gray-800 leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{
                      __html: analysis
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-green-700 font-semibold">$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em class="text-green-600">$1</em>')
                        .replace(/\n\n/g, '</p><p class="mt-4">')
                        .replace(/^(.*)$/gm, '<p>$1</p>')
                        .replace(/<p><\/p>/g, '')
                        .replace(/^\d+\.\s(.+)/gm, '<li class="ml-4 mb-2">$1</li>')
                        .replace(/(<li.*<\/li>)/s, '<ul class="list-decimal list-inside space-y-2 mt-2 mb-4">$1</ul>')
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Explanation & Q&A */}
        {originalContent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <MessageSquare size={24} />
                Get Explanation or Ask Questions
              </CardTitle>
              <CardDescription>
                Get a detailed explanation or ask specific questions about your document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExplain(false)}
                  disabled={isExplaining}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isExplaining ? 'Generating...' : 'Explain Document'}
                </Button>
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Ask a question about the document..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={() => handleExplain(true)}
                  disabled={!question.trim() || isExplaining}
                  variant="outline"
                  className="w-full"
                >
                  Ask Question
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Explanation Results */}
        {explanation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-green-600">AI Explanation</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSpeak(explanation)}
                  className="flex items-center gap-2"
                >
                  {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  {isSpeaking ? 'Stop' : 'Listen'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-none">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <div
                    className="text-gray-800 leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{
                      __html: explanation
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-700 font-semibold">$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em class="text-blue-600">$1</em>')
                        .replace(/\n\n/g, '</p><p class="mt-4">')
                        .replace(/^(.*)$/gm, '<p>$1</p>')
                        .replace(/<p><\/p>/g, '')
                        .replace(/^\d+\.\s(.+)/gm, '<li class="ml-4 mb-2">$1</li>')
                        .replace(/(<li.*<\/li>)/s, '<ul class="list-decimal list-inside space-y-2 mt-2 mb-4">$1</ul>')
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
