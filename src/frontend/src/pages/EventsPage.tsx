import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type Event as LocalEvent,
  useDismissEventNotification,
  useGetTodaysEvents,
} from "@/hooks/useQueries";
import { format } from "date-fns";
import {
  Bell,
  Cake,
  CalendarIcon,
  GraduationCap,
  Heart,
  PartyPopper,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  date: Date;
  type: string;
  description: string;
  reminder: boolean;
}

interface EventNotificationProps {
  event: LocalEvent;
  onDismiss: () => void;
}

function EventNotification({ event, onDismiss }: EventNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const eventDate = new Date(Number(event.date));
  const timeString = format(eventDate, "h:mm a");

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
      <Card className="w-80 md:w-96 border-4 border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.5)] bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="p-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.6)]">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <CardTitle
                  className="text-lg font-bold text-purple-900"
                  style={{ fontFamily: "'Baloo 2', cursive" }}
                >
                  Event Today! 🎉
                </CardTitle>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-8 w-8 rounded-full hover:bg-purple-200 text-purple-700 hover:text-purple-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <p
              className="font-bold text-xl text-purple-900"
              style={{ fontFamily: "'Baloo 2', cursive" }}
            >
              {event.title}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Badge
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                style={{ fontFamily: "'Baloo 2', cursive" }}
              >
                {event.eventType}
              </Badge>
              <span
                className="text-purple-700 font-semibold"
                style={{ fontFamily: "'Baloo 2', cursive" }}
              >
                {timeString}
              </span>
            </div>
          </div>
          {event.description && (
            <p
              className="text-sm text-purple-800"
              style={{ fontFamily: "'Baloo 2', cursive" }}
            >
              {event.description}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "My Birthday",
      date: new Date(2025, 11, 25),
      type: "birthday",
      description: "My special day!",
      reminder: true,
    },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date(),
    type: "birthday",
    description: "",
    reminder: true,
  });

  // Fetch today's events
  const { data: todaysEvents = [] } = useGetTodaysEvents();

  // Mutation to dismiss notification
  const dismissMutation = useDismissEventNotification();

  const handleDismissNotification = (eventId: string) => {
    dismissMutation.mutate(eventId);
  };

  const eventTypes = [
    { value: "birthday", label: "Birthday", icon: Cake, color: "bg-pink-500" },
    {
      value: "festival",
      label: "Festival",
      icon: PartyPopper,
      color: "bg-purple-500",
    },
    {
      value: "school",
      label: "School Event",
      icon: GraduationCap,
      color: "bg-blue-500",
    },
    {
      value: "family",
      label: "Family Event",
      icon: Heart,
      color: "bg-red-500",
    },
  ];

  const handleAddEvent = () => {
    if (!newEvent.title.trim()) {
      toast.error("Please enter an event title");
      return;
    }

    const event: Event = {
      id: Date.now().toString(),
      ...newEvent,
    };

    setEvents([...events, event]);
    setNewEvent({
      title: "",
      date: new Date(),
      type: "birthday",
      description: "",
      reminder: true,
    });
    setShowAddForm(false);
    toast.success("Event added successfully! 🎉");
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
    toast.success("Event deleted");
  };

  const getEventIcon = (type: string) => {
    const eventType = eventTypes.find((t) => t.value === type);
    const Icon = eventType?.icon || CalendarIcon;
    return <Icon className="w-5 h-5" />;
  };

  const getEventColor = (type: string) => {
    return eventTypes.find((t) => t.value === type)?.color || "bg-gray-500";
  };

  const sortedEvents = [...events].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  return (
    <div className="space-y-6">
      {/* Event Notifications */}
      {todaysEvents.map((event, index) => (
        <div
          key={event.id}
          style={{ top: `${4 + index * 180}px` }}
          className="fixed right-4 z-50"
        >
          <EventNotification
            event={event}
            onDismiss={() => handleDismissNotification(event.id)}
          />
        </div>
      ))}

      <div className="text-center">
        <h1
          className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
          style={{ fontFamily: "'Baloo 2', cursive" }}
        >
          Events Calendar 🎉
        </h1>
        <p
          className="text-lg text-gray-700"
          style={{ fontFamily: "'Baloo 2', cursive" }}
        >
          Track birthdays, festivals, and special occasions
        </p>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="lg"
          className="gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          style={{ fontFamily: "'Baloo 2', cursive" }}
        >
          <Plus className="w-5 h-5" />
          Add New Event
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-4 border-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
          <CardHeader>
            <CardTitle style={{ fontFamily: "'Baloo 2', cursive" }}>
              Create New Event
            </CardTitle>
            <CardDescription style={{ fontFamily: "'Baloo 2', cursive" }}>
              Add a special date to remember
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="title"
                style={{ fontFamily: "'Baloo 2', cursive" }}
              >
                Event Title
              </Label>
              <Input
                id="title"
                placeholder="e.g., My Birthday"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
                style={{ fontFamily: "'Baloo 2', cursive" }}
              />
            </div>

            <div className="space-y-2">
              <Label style={{ fontFamily: "'Baloo 2', cursive" }}>
                Event Type
              </Label>
              <Select
                value={newEvent.type}
                onValueChange={(value) =>
                  setNewEvent({ ...newEvent, type: value })
                }
              >
                <SelectTrigger style={{ fontFamily: "'Baloo 2', cursive" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      style={{ fontFamily: "'Baloo 2', cursive" }}
                    >
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label style={{ fontFamily: "'Baloo 2', cursive" }}>
                Event Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    style={{ fontFamily: "'Baloo 2', cursive" }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(newEvent.date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newEvent.date}
                    onSelect={(date) =>
                      date && setNewEvent({ ...newEvent, date })
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                style={{ fontFamily: "'Baloo 2', cursive" }}
              >
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Add details about this event..."
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
                style={{ fontFamily: "'Baloo 2', cursive" }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddEvent}
                className="flex-1"
                style={{ fontFamily: "'Baloo 2', cursive" }}
              >
                Add Event
              </Button>
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
                className="flex-1"
                style={{ fontFamily: "'Baloo 2', cursive" }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedEvents.map((event) => (
          <Card
            key={event.id}
            className="border-4 hover:shadow-lg transition-shadow shadow-[0_0_10px_rgba(168,85,247,0.2)]"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-full ${getEventColor(event.type)} text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]`}
                  >
                    {getEventIcon(event.type)}
                  </div>
                  <div>
                    <CardTitle
                      className="text-xl"
                      style={{ fontFamily: "'Baloo 2', cursive" }}
                    >
                      {event.title}
                    </CardTitle>
                    <CardDescription
                      style={{ fontFamily: "'Baloo 2', cursive" }}
                    >
                      {format(event.date, "MMMM d, yyyy")}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteEvent(event.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p
                className="text-gray-700"
                style={{ fontFamily: "'Baloo 2', cursive" }}
              >
                {event.description || "No description"}
              </p>
              {event.reminder && (
                <Badge
                  className="mt-2"
                  variant="secondary"
                  style={{ fontFamily: "'Baloo 2', cursive" }}
                >
                  🔔 Reminder On
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && !showAddForm && (
        <Card className="border-4 border-dashed">
          <CardContent className="py-12 text-center">
            <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p
              className="text-xl text-gray-500"
              style={{ fontFamily: "'Baloo 2', cursive" }}
            >
              No events yet
            </p>
            <p
              className="text-gray-400"
              style={{ fontFamily: "'Baloo 2', cursive" }}
            >
              Click "Add New Event" to get started!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
