'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Volume2, VolumeX, MessageSquare, CheckCircle, Search, Database } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [chunksStored, setChunksStored] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [question, setQuestion] = useState('');
  const [explanation, setExplanation] = useState('');
  const [sources, setSources] = useState([]);
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
        setUploadedFileName(result.fileName);
        setChunksStored(result.chunksStored || 0);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExplain = async () => {
    if (!question.trim() || !uploadedFileName) return;

    setIsExplaining(true);
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          fileName: uploadedFileName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setExplanation(result.explanation);
        setSources(result.sources || []);
        setQuestion('');
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                RightSteps AI Buddy
              </h1>
              <p className="text-green-600 font-medium mt-1">Your Intelligent Document Assistant</p>
            </div>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Transform any document into an intelligent conversation. Upload, analyze, and chat with your content using AI.
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl text-gray-800">
              <Upload className="w-6 h-6 text-green-600" />
              Upload Your Document
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Drop your .md or .txt file here and let AI understand it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className="border-2 border-dashed border-green-300 rounded-xl p-8 text-center hover:border-green-400 transition-all cursor-pointer group bg-gradient-to-br from-green-50 to-blue-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Input
                type="file"
                accept=".md,.txt"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
              />
              <Upload className="w-12 h-12 text-green-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <p className="text-gray-700 font-semibold text-lg">Choose file or drag and drop</p>
              <p className="text-gray-500 mt-2">Supports Markdown (.md) and Text (.txt) files</p>
            </div>

            {file && (
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-lg">{file.name}</p>
                  <p className="text-gray-600">{(file.size / 1024).toFixed(1)} KB • Ready to process</p>
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-blue-300 px-3 py-1">
                  Selected
                </Badge>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {isUploading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing Your Document...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5" />
                  Process Document with AI
                </div>
              )}
            </Button>

            {isUploading && (
              <div className="space-y-3">
                <Progress value={75} className="w-full h-3" />
                <p className="text-center text-gray-600 font-medium">Creating intelligent knowledge base...</p>
              </div>
            )}

            {chunksStored > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                  <h3 className="font-bold text-green-800 text-xl">Document Ready!</h3>
                </div>
                <p className="text-green-700 text-lg mb-4">
                  Your document has been processed and is ready for questions.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/80 rounded-lg p-4">
                    <p className="text-sm text-gray-600 uppercase tracking-wide">Chunks Processed</p>
                    <p className="text-3xl font-bold text-green-600">{chunksStored}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-4">
                    <p className="text-sm text-gray-600 uppercase tracking-wide">Status</p>
                    <p className="text-xl font-bold text-green-600">Active</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Q&A Section */}
        {uploadedFileName && (
          <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl text-gray-800">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                Ask Questions
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Ask anything about your document and get intelligent answers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Textarea
                placeholder="What would you like to know about this document?

Examples:
• What are the main points?
• Summarize the key findings
• Explain the conclusions
• What recommendations are made?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={5}
                className="text-lg p-6 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
              />

              <Button
                onClick={handleExplain}
                disabled={!question.trim() || isExplaining}
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {isExplaining ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Searching & Analyzing...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Search className="w-5 h-5" />
                    Get AI Answer
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && (
          <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-2xl text-gray-800">
                <div className="flex items-center gap-3">
                  <Search className="w-6 h-6 text-emerald-600" />
                  Document Overview
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSpeak(analysis)}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                <div
                  className="text-gray-700 leading-relaxed text-lg"
                  dangerouslySetInnerHTML={{
                    __html: analysis
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                      .replace(/\n\n/g, '</p><p class="mt-4">')
                      .replace(/^(.*)$/gm, '<p>$1</p>')
                      .replace(/<p><\/p>/g, '')
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Answer Results */}
        {explanation && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-2xl text-gray-800">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                  AI Answer
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSpeak(explanation)}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div
                  className="text-gray-700 leading-relaxed text-lg"
                  dangerouslySetInnerHTML={{
                    __html: explanation
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                      .replace(/\n\n/g, '</p><p class="mt-4">')
                      .replace(/^(.*)$/gm, '<p>$1</p>')
                      .replace(/<p><\/p>/g, '')
                  }}
                />
              </div>

              {sources.length > 0 && (
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                    <Database className="w-5 h-5 text-gray-600" />
                    Sources Referenced
                  </h4>
                  <div className="space-y-3">
                    {sources.map((source, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{source.fileName}</p>
                            <p className="text-sm text-gray-600">Section {source.chunkIndex + 1}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{width: `${Math.round(source.similarity * 100)}%`}}
                            />
                          </div>
                          <span className="text-sm text-gray-600 font-semibold">
                            {Math.round(source.similarity * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}