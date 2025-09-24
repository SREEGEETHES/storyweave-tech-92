import { useState } from "react";
import { MessageCircle, X, Send, Bot, User, Calendar, CreditCard, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      message: 'Hi! I\'m here to help you choose the right plan, schedule demos, or answer any questions. How can I assist you today?'
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');

  const quickActions = [
    { label: 'Choose Plan', icon: CreditCard, action: () => handleQuickAction('help-plan') },
    { label: 'Schedule Demo', icon: Calendar, action: () => handleQuickAction('schedule-demo') },
    { label: 'FAQs', icon: HelpCircle, action: () => handleQuickAction('faqs') }
  ];

  const handleQuickAction = (action: string) => {
    let response = '';
    switch (action) {
      case 'help-plan':
        response = 'I\'d be happy to help you choose the right plan! What type of videos are you planning to create? Are you an individual creator, small business, or enterprise?';
        break;
      case 'schedule-demo':
        response = 'Perfect! I can help you schedule an enterprise demo. Our demos showcase advanced features like team collaboration, custom branding, and enterprise-grade security. Would you prefer a 30-minute or 60-minute session?';
        break;
      case 'faqs':
        response = 'Here are some frequently asked questions:\n\n• How many videos can I create?\n• Can I cancel anytime?\n• Do you offer custom integrations?\n• What video formats are supported?\n\nWhich topic would you like to know more about?';
        break;
    }
    
    const userMessage = { id: Date.now(), type: 'user', message: action === 'help-plan' ? 'Help me choose a plan' : action === 'schedule-demo' ? 'Schedule a demo' : 'Show FAQs' };
    const botMessage = { id: Date.now() + 1, type: 'bot', message: response };
    
    setMessages(prev => [...prev, userMessage, botMessage]);
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage = { id: Date.now(), type: 'user', message: currentMessage };
    setMessages(prev => [...prev, userMessage]);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: Date.now(),
        type: 'bot',
        message: 'Thanks for your message! For detailed assistance, our team will get back to you shortly. In the meantime, feel free to explore our features or check out our pricing plans.'
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);

    setCurrentMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </Button>

      {/* Chatbot Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-2rem)]">
          <Card className="glass shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <Bot className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-primary">AI Assistant</CardTitle>
                    <Badge variant="secondary" className="text-xs">Online</Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={action.action}
                    className="text-xs"
                  >
                    <action.icon className="h-3 w-3 mr-1" />
                    {action.label}
                  </Button>
                ))}
              </div>

              {/* Messages */}
              <div className="h-64 overflow-y-auto space-y-3 pr-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.type === 'bot' && (
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="h-3 w-3 text-accent-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-line ${
                        msg.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {msg.message}
                    </div>
                    {msg.type === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  size="sm"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default Chatbot;