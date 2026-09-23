"use client";

import React from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles } from "lucide-react";
import { CMSSectionKey } from "@/lib/types/cms";

interface FormProps<T> {
  value: T;
  onChange: (val: T) => void;
}

// Reusable Sub-components
export function FormField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-[#464137]">
        {label}
      </label>
      {description && <p className="text-[0.7rem] text-[#6F6B61]">{description}</p>}
      {children}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string | number | undefined;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-[#464137]/20 bg-[#FAF8F2] px-3.5 py-2 text-xs text-[#292923] outline-none transition-all placeholder:text-[#6F6B61]/40 focus:border-[#68705A] focus:ring-1 focus:ring-[#68705A]"
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string | undefined;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-md border border-[#464137]/20 bg-[#FAF8F2] px-3.5 py-2 text-xs text-[#292923] outline-none transition-all placeholder:text-[#6F6B61]/40 focus:border-[#68705A] focus:ring-1 focus:ring-[#68705A] leading-relaxed"
    />
  );
}

export function StringListEditor({
  label,
  items,
  onChange,
  placeholder = "Enter item...",
}: {
  label: string;
  items: string[] | undefined;
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const list = items || [];

  const handleAdd = () => {
    onChange([...list, ""]);
  };

  const handleChange = (index: number, val: string) => {
    const updated = [...list];
    updated[index] = val;
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(list.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#464137]">
          {label} ({list.length})
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-[#68705A] hover:underline"
        >
          <Plus className="size-3.5" />
          <span>Add Item</span>
        </button>
      </div>

      <div className="space-y-2">
        {list.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-[0.65rem] font-mono text-[#6F6B61] w-4">{idx + 1}.</span>
            <input
              type="text"
              value={item}
              onChange={(e) => handleChange(idx, e.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-md border border-[#464137]/20 bg-[#FAF8F2] px-3 py-1.5 text-xs text-[#292923] outline-none focus:border-[#68705A]"
            />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="p-1.5 rounded text-[#A24B4B] hover:bg-[#A24B4B]/10"
              title="Remove item"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// 1. Brand Form
export function BrandForm({ value, onChange }: FormProps<any>) {
  return (
    <div className="space-y-4">
      <FormField label="Instructor Name">
        <TextInput value={value?.name} onChange={(val) => onChange({ ...value, name: val })} />
      </FormField>
      <FormField label="Studio Name">
        <TextInput value={value?.studioName} onChange={(val) => onChange({ ...value, studioName: val })} />
      </FormField>
      <FormField label="Main Tagline">
        <TextInput value={value?.tagline} onChange={(val) => onChange({ ...value, tagline: val })} />
      </FormField>
      <FormField label="Sub Tagline">
        <TextInput value={value?.subTagline} onChange={(val) => onChange({ ...value, subTagline: val })} />
      </FormField>
    </div>
  );
}

// 2. Hero Form
export function HeroForm({ value, onChange }: FormProps<any>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField label="Pill / Badge Label">
        <TextInput value={value?.pillLabel} onChange={(val) => onChange({ ...value, pillLabel: val })} />
      </FormField>
      <FormField label="Handwritten Accent Phrase">
        <TextInput value={value?.handwrittenPhrase} onChange={(val) => onChange({ ...value, handwrittenPhrase: val })} />
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="Headline Start">
          <TextInput value={value?.headlineStart} onChange={(val) => onChange({ ...value, headlineStart: val })} />
        </FormField>
      </div>
      <div className="sm:col-span-2">
        <FormField label="Headline Highlight (Golden Serif)">
          <TextInput value={value?.headlineHighlight} onChange={(val) => onChange({ ...value, headlineHighlight: val })} />
        </FormField>
      </div>
      <div className="sm:col-span-2">
        <FormField label="Subheadline Description">
          <TextArea value={value?.subheadline} onChange={(val) => onChange({ ...value, subheadline: val })} rows={2} />
        </FormField>
      </div>
      <FormField label="Workshop Date String">
        <TextInput value={value?.date} onChange={(val) => onChange({ ...value, date: val })} />
      </FormField>
      <FormField label="Workshop Time String">
        <TextInput value={value?.time} onChange={(val) => onChange({ ...value, time: val })} />
      </FormField>
      <FormField label="Duration">
        <TextInput value={value?.duration} onChange={(val) => onChange({ ...value, duration: val })} />
      </FormField>
      <FormField label="Demonstration Language">
        <TextInput value={value?.language} onChange={(val) => onChange({ ...value, language: val })} />
      </FormField>
      <FormField label="CTA Button Text">
        <TextInput value={value?.ctaText} onChange={(val) => onChange({ ...value, ctaText: val })} />
      </FormField>
      <FormField label="Urgency Note">
        <TextInput value={value?.urgencyText} onChange={(val) => onChange({ ...value, urgencyText: val })} />
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="Guarantee / Atelier Limit Note">
          <TextInput value={value?.guaranteeText} onChange={(val) => onChange({ ...value, guaranteeText: val })} />
        </FormField>
      </div>
      <div className="sm:col-span-2">
        <FormField label="Target Audience Sub-note">
          <TextInput value={value?.targetAudienceNote} onChange={(val) => onChange({ ...value, targetAudienceNote: val })} />
        </FormField>
      </div>
      <FormField label="Instructor Name">
        <TextInput value={value?.instructorName} onChange={(val) => onChange({ ...value, instructorName: val })} />
      </FormField>
      <FormField label="Instructor Title">
        <TextInput value={value?.instructorTitle} onChange={(val) => onChange({ ...value, instructorTitle: val })} />
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="Instructor Image Path">
          <TextInput value={value?.instructorImage} onChange={(val) => onChange({ ...value, instructorImage: val })} />
        </FormField>
      </div>
    </div>
  );
}

// 3. Stats Form
export function StatsForm({ value, onChange }: FormProps<any[]>) {
  const items = Array.isArray(value) ? value : [];

  const addItem = () => {
    onChange([...items, { number: "100+", label: "New Metric", icon: "Sparkles" }]);
  };

  const updateItem = (index: number, patch: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#464137]">
          Stat Counter Cards ({items.length})
        </span>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#68705A] hover:underline"
        >
          <Plus className="size-3.5" />
          <span>Add Stat</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item, idx) => (
          <div key={idx} className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/15 space-y-3 relative">
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="absolute top-3 right-3 text-[#A24B4B] hover:opacity-80"
              title="Remove"
            >
              <Trash2 className="size-3.5" />
            </button>
            <FormField label="Value / Number">
              <TextInput value={item.number} onChange={(val) => updateItem(idx, { number: val })} />
            </FormField>
            <FormField label="Label / Description">
              <TextInput value={item.label} onChange={(val) => updateItem(idx, { label: val })} />
            </FormField>
            <FormField label="Icon Identifier">
              <TextInput value={item.icon} onChange={(val) => updateItem(idx, { icon: val })} />
            </FormField>
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. Trust Section Form
export function TrustSectionForm({ value, onChange }: FormProps<any>) {
  return (
    <div className="space-y-4">
      <FormField label="Overline / Eyebrow">
        <TextInput value={value?.overline} onChange={(val) => onChange({ ...value, overline: val })} />
      </FormField>
      <FormField label="Headline Start">
        <TextInput value={value?.headline} onChange={(val) => onChange({ ...value, headline: val })} />
      </FormField>
      <FormField label="Headline Highlight">
        <TextInput value={value?.headlineHighlight} onChange={(val) => onChange({ ...value, headlineHighlight: val })} />
      </FormField>
      <FormField label="Description Paragraph">
        <TextArea value={value?.description} onChange={(val) => onChange({ ...value, description: val })} rows={3} />
      </FormField>
    </div>
  );
}

// 5. About Artist Form
export function AboutArtistForm({ value, onChange }: FormProps<any>) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Eyebrow">
          <TextInput value={value?.eyebrow} onChange={(val) => onChange({ ...value, eyebrow: val })} />
        </FormField>
        <FormField label="Heading">
          <TextInput value={value?.heading} onChange={(val) => onChange({ ...value, heading: val })} />
        </FormField>
        <FormField label="Role / Title">
          <TextInput value={value?.role} onChange={(val) => onChange({ ...value, role: val })} />
        </FormField>
      </div>

      <FormField label="Introduction Lead">
        <TextArea value={value?.introduction} onChange={(val) => onChange({ ...value, introduction: val })} rows={3} />
      </FormField>

      <StringListEditor
        label="Bio Paragraphs"
        items={value?.bio}
        onChange={(items) => onChange({ ...value, bio: items })}
        placeholder="Bio paragraph text..."
      />

      <StringListEditor
        label="Qualifications & Credentials"
        items={value?.qualifications}
        onChange={(items) => onChange({ ...value, qualifications: items })}
        placeholder="e.g. 15+ years studio practice..."
      />

      <StringListEditor
        label="Core Expertise Areas"
        items={value?.expertise}
        onChange={(items) => onChange({ ...value, expertise: items })}
        placeholder="e.g. Wet-on-wet watercolor mastery..."
      />
    </div>
  );
}

// 6. Target Audience Form
export function TargetAudienceForm({ value, onChange }: FormProps<any>) {
  const items: any[] = Array.isArray(value?.items) ? value.items : [];

  const addItem = () => {
    onChange({
      ...value,
      items: [
        ...items,
        {
          id: `aud-${Date.now()}`,
          title: "New Audience Persona",
          description: "Description of audience profile...",
          icon: "Heart",
        },
      ],
    });
  };

  const updateItem = (index: number, patch: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...patch };
    onChange({ ...value, items: updated });
  };

  const removeItem = (index: number) => {
    onChange({ ...value, items: items.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-5">
      <FormField label="Section Heading">
        <TextInput value={value?.heading} onChange={(val) => onChange({ ...value, heading: val })} />
      </FormField>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#464137]">
          Audience Persona Cards ({items.length})
        </span>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#68705A] hover:underline"
        >
          <Plus className="size-3.5" />
          <span>Add Persona</span>
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item: any, idx: number) => (
          <div key={item.id || idx} className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/15 space-y-3 relative">
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="absolute top-3 right-3 text-[#A24B4B] hover:opacity-80"
              title="Remove"
            >
              <Trash2 className="size-3.5" />
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Card Title">
                <TextInput value={item.title} onChange={(val) => updateItem(idx, { title: val })} />
              </FormField>
              <FormField label="Icon Identifier">
                <TextInput value={item.icon} onChange={(val) => updateItem(idx, { icon: val })} />
              </FormField>
            </div>
            <FormField label="Persona Description">
              <TextArea value={item.description} onChange={(val) => updateItem(idx, { description: val })} rows={2} />
            </FormField>
            <FormField label="Optional Direct Quote">
              <TextInput value={item.quote} onChange={(val) => updateItem(idx, { quote: val })} placeholder="e.g. 'I used to think I had no creative bone...'" />
            </FormField>
          </div>
        ))}
      </div>
    </div>
  );
}

// 7. Video Section Form
export function VideoSectionForm({ value, onChange }: FormProps<any>) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Overline">
          <TextInput value={value?.overline} onChange={(val) => onChange({ ...value, overline: val })} />
        </FormField>
        <FormField label="Headline">
          <TextInput value={value?.headline} onChange={(val) => onChange({ ...value, headline: val })} />
        </FormField>
        <FormField label="Video Title">
          <TextInput value={value?.videoTitle} onChange={(val) => onChange({ ...value, videoTitle: val })} />
        </FormField>
        <FormField label="Video Thumbnail Path">
          <TextInput value={value?.videoThumbnail} onChange={(val) => onChange({ ...value, videoThumbnail: val })} />
        </FormField>
        <FormField label="YouTube Embed / Video ID">
          <TextInput value={value?.youtubeId} onChange={(val) => onChange({ ...value, youtubeId: val })} />
        </FormField>
        <FormField label="CTA Button Text">
          <TextInput value={value?.ctaText} onChange={(val) => onChange({ ...value, ctaText: val })} />
        </FormField>
      </div>

      <StringListEditor
        label="Key Learning Takeaways"
        items={value?.learningPoints}
        onChange={(items) => onChange({ ...value, learningPoints: items })}
        placeholder="Key technique demonstrated..."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Takeaway Heading">
          <TextInput value={value?.takeawayHeading} onChange={(val) => onChange({ ...value, takeawayHeading: val })} />
        </FormField>
        <FormField label="Handwritten Studio Note">
          <TextInput value={value?.handwrittenNote} onChange={(val) => onChange({ ...value, handwrittenNote: val })} />
        </FormField>
      </div>
      <FormField label="Takeaway Text Body">
        <TextArea value={value?.takeawayText} onChange={(val) => onChange({ ...value, takeawayText: val })} rows={2} />
      </FormField>
    </div>
  );
}

// 8. Transformation Form
export function TransformationForm({ value, onChange }: FormProps<any>) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Overline">
          <TextInput value={value?.overline} onChange={(val) => onChange({ ...value, overline: val })} />
        </FormField>
        <FormField label="Headline">
          <TextInput value={value?.headline} onChange={(val) => onChange({ ...value, headline: val })} />
        </FormField>
        <FormField label="Headline Highlight">
          <TextInput value={value?.headlineHighlight} onChange={(val) => onChange({ ...value, headlineHighlight: val })} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
        <div className="space-y-3 p-4 rounded-lg bg-[#FAF8F2] border border-[#464137]/15">
          <FormField label="'Before' Column Title">
            <TextInput value={value?.beforeTitle} onChange={(val) => onChange({ ...value, beforeTitle: val })} />
          </FormField>
          <StringListEditor
            label="Struggle / Before Points"
            items={value?.beforePoints}
            onChange={(items) => onChange({ ...value, beforePoints: items })}
          />
        </div>

        <div className="space-y-3 p-4 rounded-lg bg-[#FAF8F2] border border-[#464137]/15">
          <FormField label="'After' Column Title">
            <TextInput value={value?.afterTitle} onChange={(val) => onChange({ ...value, afterTitle: val })} />
          </FormField>
          <StringListEditor
            label="Mastery / After Points"
            items={value?.afterPoints}
            onChange={(items) => onChange({ ...value, afterPoints: items })}
          />
        </div>
      </div>

      <FormField label="Closing Transformation Takeaway">
        <TextInput value={value?.takeaway} onChange={(val) => onChange({ ...value, takeaway: val })} />
      </FormField>
    </div>
  );
}

// 9. Method Framework Form
export function MethodFrameworkForm({ value, onChange }: FormProps<any>) {
  const steps: any[] = Array.isArray(value?.steps) ? value.steps : [];

  const addStep = () => {
    onChange({
      ...value,
      steps: [
        ...steps,
        {
          number: `0${steps.length + 1}`,
          title: "New Method Step",
          subtitle: "Phase Subtitle",
          description: "Step details...",
          icon: "Sparkles",
        },
      ],
    });
  };

  const updateStep = (index: number, patch: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], ...patch };
    onChange({ ...value, steps: updated });
  };

  const removeStep = (index: number) => {
    onChange({ ...value, steps: steps.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Overline">
          <TextInput value={value?.overline} onChange={(val) => onChange({ ...value, overline: val })} />
        </FormField>
        <FormField label="Headline">
          <TextInput value={value?.headline} onChange={(val) => onChange({ ...value, headline: val })} />
        </FormField>
        <FormField label="Headline Highlight">
          <TextInput value={value?.headlineHighlight} onChange={(val) => onChange({ ...value, headlineHighlight: val })} />
        </FormField>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#464137]">
          Method Steps ({steps.length})
        </span>
        <button
          type="button"
          onClick={addStep}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#68705A] hover:underline"
        >
          <Plus className="size-3.5" />
          <span>Add Step</span>
        </button>
      </div>

      <div className="space-y-4">
        {steps.map((step: any, idx: number) => (
          <div key={idx} className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/15 space-y-3 relative">
            <button
              type="button"
              onClick={() => removeStep(idx)}
              className="absolute top-3 right-3 text-[#A24B4B] hover:opacity-80"
              title="Remove"
            >
              <Trash2 className="size-3.5" />
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Step Number">
                <TextInput value={step.number} onChange={(val) => updateStep(idx, { number: val })} />
              </FormField>
              <FormField label="Title">
                <TextInput value={step.title} onChange={(val) => updateStep(idx, { title: val })} />
              </FormField>
              <FormField label="Subtitle">
                <TextInput value={step.subtitle} onChange={(val) => updateStep(idx, { subtitle: val })} />
              </FormField>
            </div>
            <FormField label="Step Description">
              <TextArea value={step.description} onChange={(val) => updateStep(idx, { description: val })} rows={2} />
            </FormField>
          </div>
        ))}
      </div>

      <FormField label="Pill Summary / Bottom Note">
        <TextInput value={value?.pillSummary} onChange={(val) => onChange({ ...value, pillSummary: val })} />
      </FormField>
    </div>
  );
}

// 10. Core Secrets Form
export function CoreSecretsForm({ value, onChange }: FormProps<any>) {
  const secrets: any[] = Array.isArray(value?.secrets) ? value.secrets : [];

  const addSecret = () => {
    onChange({
      ...value,
      secrets: [
        ...secrets,
        {
          number: `Secret #${secrets.length + 1}`,
          title: "New Technique Secret",
          subtitle: "Key Focus Area",
          description: "Technique breakdown...",
          bullets: ["Key bullet 1", "Key bullet 2"],
          icon: "Sparkles",
        },
      ],
    });
  };

  const updateSecret = (index: number, patch: any) => {
    const updated = [...secrets];
    updated[index] = { ...updated[index], ...patch };
    onChange({ ...value, secrets: updated });
  };

  const removeSecret = (index: number) => {
    onChange({ ...value, secrets: secrets.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Overline">
          <TextInput value={value?.overline} onChange={(val) => onChange({ ...value, overline: val })} />
        </FormField>
        <FormField label="Headline">
          <TextInput value={value?.headline} onChange={(val) => onChange({ ...value, headline: val })} />
        </FormField>
        <FormField label="Headline Highlight">
          <TextInput value={value?.headlineHighlight} onChange={(val) => onChange({ ...value, headlineHighlight: val })} />
        </FormField>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#464137]">
          Core Secrets Cards ({secrets.length})
        </span>
        <button
          type="button"
          onClick={addSecret}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#68705A] hover:underline"
        >
          <Plus className="size-3.5" />
          <span>Add Secret</span>
        </button>
      </div>

      <div className="space-y-4">
        {secrets.map((sec: any, idx: number) => (
          <div key={idx} className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/15 space-y-3 relative">
            <button
              type="button"
              onClick={() => removeSecret(idx)}
              className="absolute top-3 right-3 text-[#A24B4B] hover:opacity-80"
              title="Remove"
            >
              <Trash2 className="size-3.5" />
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Number/Tag">
                <TextInput value={sec.number} onChange={(val) => updateSecret(idx, { number: val })} />
              </FormField>
              <FormField label="Secret Title">
                <TextInput value={sec.title} onChange={(val) => updateSecret(idx, { title: val })} />
              </FormField>
              <FormField label="Subtitle">
                <TextInput value={sec.subtitle} onChange={(val) => updateSecret(idx, { subtitle: val })} />
              </FormField>
            </div>
            <FormField label="Description">
              <TextArea value={sec.description} onChange={(val) => updateSecret(idx, { description: val })} rows={2} />
            </FormField>
            <StringListEditor
              label="Key Technique Bullets"
              items={sec.bullets}
              onChange={(bullets) => updateSecret(idx, { bullets })}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Bottom Note">
          <TextInput value={value?.bottomNote} onChange={(val) => onChange({ ...value, bottomNote: val })} />
        </FormField>
        <FormField label="CTA Button Text">
          <TextInput value={value?.ctaText} onChange={(val) => onChange({ ...value, ctaText: val })} />
        </FormField>
      </div>
    </div>
  );
}

// 11. Outcomes Form
export function OutcomesForm({ value, onChange }: FormProps<any>) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Overline">
          <TextInput value={value?.overline} onChange={(val) => onChange({ ...value, overline: val })} />
        </FormField>
        <FormField label="Headline">
          <TextInput value={value?.headline} onChange={(val) => onChange({ ...value, headline: val })} />
        </FormField>
        <FormField label="Headline Highlight">
          <TextInput value={value?.headlineHighlight} onChange={(val) => onChange({ ...value, headlineHighlight: val })} />
        </FormField>
      </div>
      <FormField label="Description">
        <TextArea value={value?.description} onChange={(val) => onChange({ ...value, description: val })} rows={2} />
      </FormField>
      <StringListEditor
        label="Tangible Workshop Outcomes"
        items={value?.items}
        onChange={(items) => onChange({ ...value, items })}
      />
      <FormField label="Disclaimer Note">
        <TextInput value={value?.disclaimer} onChange={(val) => onChange({ ...value, disclaimer: val })} />
      </FormField>
    </div>
  );
}

// 12. Instructor Story Form
export function InstructorStoryForm({ value, onChange }: FormProps<any>) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Overline">
          <TextInput value={value?.overline} onChange={(val) => onChange({ ...value, overline: val })} />
        </FormField>
        <FormField label="Headline">
          <TextInput value={value?.headline} onChange={(val) => onChange({ ...value, headline: val })} />
        </FormField>
        <FormField label="Instructor Name">
          <TextInput value={value?.name} onChange={(val) => onChange({ ...value, name: val })} />
        </FormField>
      </div>
      <FormField label="Subtitle">
        <TextInput value={value?.subtitle} onChange={(val) => onChange({ ...value, subtitle: val })} />
      </FormField>
      <StringListEditor
        label="Story Narrative Paragraphs"
        items={value?.paragraphs}
        onChange={(paragraphs) => onChange({ ...value, paragraphs })}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Quote">
          <TextArea value={value?.quote} onChange={(val) => onChange({ ...value, quote: val })} rows={2} />
        </FormField>
        <div className="space-y-4">
          <FormField label="Quote Author">
            <TextInput value={value?.quoteAuthor} onChange={(val) => onChange({ ...value, quoteAuthor: val })} />
          </FormField>
          <FormField label="Story Image Path">
            <TextInput value={value?.image} onChange={(val) => onChange({ ...value, image: val })} />
          </FormField>
        </div>
      </div>
    </div>
  );
}

// 13. Bonuses Form
export function BonusesForm({ value, onChange }: FormProps<any>) {
  const items: any[] = Array.isArray(value?.items) ? value.items : [];

  const addBonus = () => {
    onChange({
      ...value,
      items: [
        ...items,
        {
          id: `bonus-${Date.now()}`,
          title: "New Exclusive Bonus",
          description: "Bonus description...",
          type: "Digital PDF Guide",
          icon: "Sparkles",
        },
      ],
    });
  };

  const updateBonus = (index: number, patch: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...patch };
    onChange({ ...value, items: updated });
  };

  const removeBonus = (index: number) => {
    onChange({ ...value, items: items.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Overline">
          <TextInput value={value?.overline} onChange={(val) => onChange({ ...value, overline: val })} />
        </FormField>
        <FormField label="Headline">
          <TextInput value={value?.headline} onChange={(val) => onChange({ ...value, headline: val })} />
        </FormField>
        <FormField label="Headline Highlight">
          <TextInput value={value?.headlineHighlight} onChange={(val) => onChange({ ...value, headlineHighlight: val })} />
        </FormField>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#464137]">
          Bonus Items ({items.length})
        </span>
        <button
          type="button"
          onClick={addBonus}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#68705A] hover:underline"
        >
          <Plus className="size-3.5" />
          <span>Add Bonus</span>
        </button>
      </div>

      <div className="space-y-4">
        {items.map((b: any, idx: number) => (
          <div key={b.id || idx} className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/15 space-y-3 relative">
            <button
              type="button"
              onClick={() => removeBonus(idx)}
              className="absolute top-3 right-3 text-[#A24B4B] hover:opacity-80"
              title="Remove"
            >
              <Trash2 className="size-3.5" />
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Title">
                <TextInput value={b.title} onChange={(val) => updateBonus(idx, { title: val })} />
              </FormField>
              <FormField label="Type / Value Tag">
                <TextInput value={b.type} onChange={(val) => updateBonus(idx, { type: val })} />
              </FormField>
              <FormField label="Icon Identifier">
                <TextInput value={b.icon} onChange={(val) => updateBonus(idx, { icon: val })} />
              </FormField>
            </div>
            <FormField label="Bonus Description">
              <TextArea value={b.description} onChange={(val) => updateBonus(idx, { description: val })} rows={2} />
            </FormField>
          </div>
        ))}
      </div>

      <FormField label="Delivery Note">
        <TextInput value={value?.deliveryNote} onChange={(val) => onChange({ ...value, deliveryNote: val })} />
      </FormField>
    </div>
  );
}

// 14. Fit Check Form
export function FitCheckForm({ value, onChange }: FormProps<any>) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Overline">
          <TextInput value={value?.overline} onChange={(val) => onChange({ ...value, overline: val })} />
        </FormField>
        <FormField label="Headline">
          <TextInput value={value?.headline} onChange={(val) => onChange({ ...value, headline: val })} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
        <div className="space-y-3 p-4 rounded-lg bg-[#FAF8F2] border border-[#464137]/15">
          <FormField label="'This Is For You If' Title">
            <TextInput value={value?.fitTitle} onChange={(val) => onChange({ ...value, fitTitle: val })} />
          </FormField>
          <StringListEditor
            label="Ideal Match Criteria"
            items={value?.fitPoints}
            onChange={(fitPoints) => onChange({ ...value, fitPoints })}
          />
        </div>

        <div className="space-y-3 p-4 rounded-lg bg-[#FAF8F2] border border-[#464137]/15">
          <FormField label="'This Is NOT For You If' Title">
            <TextInput value={value?.unfitTitle} onChange={(val) => onChange({ ...value, unfitTitle: val })} />
          </FormField>
          <StringListEditor
            label="Non-Match Criteria"
            items={value?.unfitPoints}
            onChange={(unfitPoints) => onChange({ ...value, unfitPoints })}
          />
        </div>
      </div>

      <FormField label="Closing Note">
        <TextInput value={value?.closingNote} onChange={(val) => onChange({ ...value, closingNote: val })} />
      </FormField>
    </div>
  );
}

// 15. Included Form
export function IncludedForm({ value, onChange }: FormProps<any>) {
  const items: any[] = Array.isArray(value?.items) ? value.items : [];

  const addItem = () => {
    onChange({
      ...value,
      items: [...items, { title: "New Inclusions Item", status: "Included" }],
    });
  };

  const updateItem = (index: number, patch: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...patch };
    onChange({ ...value, items: updated });
  };

  const removeItem = (index: number) => {
    onChange({ ...value, items: items.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Overline">
          <TextInput value={value?.overline} onChange={(val) => onChange({ ...value, overline: val })} />
        </FormField>
        <FormField label="Headline">
          <TextInput value={value?.headline} onChange={(val) => onChange({ ...value, headline: val })} />
        </FormField>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#464137]">
          Inclusions List ({items.length})
        </span>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#68705A] hover:underline"
        >
          <Plus className="size-3.5" />
          <span>Add Item</span>
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F4EC] border border-[#464137]/15">
            <span className="text-xs font-mono text-[#6F6B61]">{idx + 1}.</span>
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(idx, { title: e.target.value })}
              className="flex-1 rounded border border-[#464137]/20 bg-[#FAF8F2] px-3 py-1.5 text-xs text-[#292923]"
              placeholder="Item name..."
            />
            <input
              type="text"
              value={item.status}
              onChange={(e) => updateItem(idx, { status: e.target.value })}
              className="w-32 rounded border border-[#464137]/20 bg-[#FAF8F2] px-2.5 py-1.5 text-xs text-[#292923]"
              placeholder="Status (Included)"
            />
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="text-[#A24B4B] p-1.5 hover:bg-[#A24B4B]/10 rounded"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <FormField label="Fee Label">
          <TextInput value={value?.feeLabel} onChange={(val) => onChange({ ...value, feeLabel: val })} />
        </FormField>
        <FormField label="Fee Value">
          <TextInput value={value?.feeValue} onChange={(val) => onChange({ ...value, feeValue: val })} />
        </FormField>
        <FormField label="CTA Text">
          <TextInput value={value?.ctaText} onChange={(val) => onChange({ ...value, ctaText: val })} />
        </FormField>
      </div>
      <FormField label="Guarantee Note">
        <TextInput value={value?.guaranteeNote} onChange={(val) => onChange({ ...value, guaranteeNote: val })} />
      </FormField>
    </div>
  );
}

// 16. FAQs Form
export function FAQsForm({ value, onChange }: FormProps<any[]>) {
  const faqs = Array.isArray(value) ? value : [];

  const addFaq = () => {
    onChange([
      ...faqs,
      {
        question: "New Frequently Asked Question?",
        answer: "Detailed answer providing clear instructions...",
      },
    ]);
  };

  const updateFaq = (index: number, patch: any) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  };

  const removeFaq = (index: number) => {
    onChange(faqs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#464137]">
          Frequently Asked Questions ({faqs.length})
        </span>
        <button
          type="button"
          onClick={addFaq}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#68705A] hover:underline"
        >
          <Plus className="size-3.5" />
          <span>Add FAQ</span>
        </button>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/15 space-y-3 relative">
            <button
              type="button"
              onClick={() => removeFaq(idx)}
              className="absolute top-3 right-3 text-[#A24B4B] hover:opacity-80"
              title="Remove"
            >
              <Trash2 className="size-3.5" />
            </button>
            <FormField label={`Question #${idx + 1}`}>
              <TextInput value={faq.question} onChange={(val) => updateFaq(idx, { question: val })} />
            </FormField>
            <FormField label="Answer">
              <TextArea value={faq.answer} onChange={(val) => updateFaq(idx, { answer: val })} rows={3} />
            </FormField>
          </div>
        ))}
      </div>
    </div>
  );
}

// 17. Final CTA Form
export function FinalCtaForm({ value, onChange }: FormProps<any>) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Overline">
          <TextInput value={value?.overline} onChange={(val) => onChange({ ...value, overline: val })} />
        </FormField>
        <FormField label="Handwritten Phrase">
          <TextInput value={value?.handwrittenPhrase} onChange={(val) => onChange({ ...value, handwrittenPhrase: val })} />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Headline">
            <TextInput value={value?.headline} onChange={(val) => onChange({ ...value, headline: val })} />
          </FormField>
        </div>
        <div className="sm:col-span-2">
          <FormField label="Description">
            <TextArea value={value?.description} onChange={(val) => onChange({ ...value, description: val })} rows={2} />
          </FormField>
        </div>
        <FormField label="CTA Button Text">
          <TextInput value={value?.ctaText} onChange={(val) => onChange({ ...value, ctaText: val })} />
        </FormField>
        <FormField label="Date Info Note">
          <TextInput value={value?.dateInfo} onChange={(val) => onChange({ ...value, dateInfo: val })} />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Sub-note / Atelier Urgency">
            <TextInput value={value?.subNote} onChange={(val) => onChange({ ...value, subNote: val })} />
          </FormField>
        </div>
      </div>
    </div>
  );
}

// 18. Footer Form
export function FooterForm({ value, onChange }: FormProps<any>) {
  const links: any[] = Array.isArray(value?.links) ? value.links : [];

  const addLink = () => {
    onChange({
      ...value,
      links: [...links, { label: "New Link", href: "#" }],
    });
  };

  const updateLink = (index: number, patch: any) => {
    const updated = [...links];
    updated[index] = { ...updated[index], ...patch };
    onChange({ ...value, links: updated });
  };

  const removeLink = (index: number) => {
    onChange({ ...value, links: links.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <FormField label="Studio Brand Description">
        <TextArea value={value?.brandDescription} onChange={(val) => onChange({ ...value, brandDescription: val })} rows={2} />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Contact Email Address">
          <TextInput value={value?.contactEmail} onChange={(val) => onChange({ ...value, contactEmail: val })} />
        </FormField>
        <FormField label="Copyright Year">
          <TextInput
            value={value?.copyrightYear}
            onChange={(val) => onChange({ ...value, copyrightYear: parseInt(val, 10) || 2026 })}
          />
        </FormField>
        <FormField label="Handwritten Signature">
          <TextInput value={value?.handwrittenSignature} onChange={(val) => onChange({ ...value, handwrittenSignature: val })} />
        </FormField>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#464137]">
          Footer Navigation Links ({links.length})
        </span>
        <button
          type="button"
          onClick={addLink}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#68705A] hover:underline"
        >
          <Plus className="size-3.5" />
          <span>Add Link</span>
        </button>
      </div>

      <div className="space-y-3">
        {links.map((link: any, idx: number) => (
          <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F4EC] border border-[#464137]/15">
            <span className="text-xs font-mono text-[#6F6B61]">{idx + 1}.</span>
            <input
              type="text"
              value={link.label}
              onChange={(e) => updateLink(idx, { label: e.target.value })}
              className="flex-1 rounded border border-[#464137]/20 bg-[#FAF8F2] px-3 py-1.5 text-xs text-[#292923]"
              placeholder="Link label..."
            />
            <input
              type="text"
              value={link.href}
              onChange={(e) => updateLink(idx, { href: e.target.value })}
              className="flex-1 rounded border border-[#464137]/20 bg-[#FAF8F2] px-3 py-1.5 text-xs text-[#292923]"
              placeholder="Destination (e.g. #courses)..."
            />
            <button
              type="button"
              onClick={() => removeLink(idx)}
              className="text-[#A24B4B] p-1.5 hover:bg-[#A24B4B]/10 rounded"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <FormField label="Legal Disclaimer">
        <TextArea value={value?.disclaimer} onChange={(val) => onChange({ ...value, disclaimer: val })} rows={3} />
      </FormField>
    </div>
  );
}

// Master Form Switcher Component
export function DynamicSectionForm({
  sectionKey,
  value,
  onChange,
}: {
  sectionKey: CMSSectionKey;
  value: any;
  onChange: (val: any) => void;
}) {
  switch (sectionKey) {
    case "brand":
      return <BrandForm value={value} onChange={onChange} />;
    case "hero":
      return <HeroForm value={value} onChange={onChange} />;
    case "stats":
      return <StatsForm value={value} onChange={onChange} />;
    case "trustSection":
      return <TrustSectionForm value={value} onChange={onChange} />;
    case "aboutArtist":
      return <AboutArtistForm value={value} onChange={onChange} />;
    case "targetAudience":
      return <TargetAudienceForm value={value} onChange={onChange} />;
    case "videoSection":
      return <VideoSectionForm value={value} onChange={onChange} />;
    case "transformation":
      return <TransformationForm value={value} onChange={onChange} />;
    case "methodFramework":
      return <MethodFrameworkForm value={value} onChange={onChange} />;
    case "coreSecrets":
      return <CoreSecretsForm value={value} onChange={onChange} />;
    case "outcomes":
      return <OutcomesForm value={value} onChange={onChange} />;
    case "instructorStory":
      return <InstructorStoryForm value={value} onChange={onChange} />;
    case "bonuses":
      return <BonusesForm value={value} onChange={onChange} />;
    case "fitCheck":
      return <FitCheckForm value={value} onChange={onChange} />;
    case "included":
      return <IncludedForm value={value} onChange={onChange} />;
    case "faqs":
      return <FAQsForm value={value} onChange={onChange} />;
    case "finalCta":
      return <FinalCtaForm value={value} onChange={onChange} />;
    case "footer":
      return <FooterForm value={value} onChange={onChange} />;
    default:
      return <div>Unknown section key: {sectionKey}</div>;
  }
}
