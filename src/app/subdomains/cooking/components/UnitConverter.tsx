'use client';

import { useEffect, useState } from 'react';

import { useToast } from '~/components/Toast';
import { Button } from '~/components/ui/Button';

interface Conversion {
  id: string;
  fromUnit: string;
  toUnit: string;
  factor: number;
  upvotes: number;
  downvotes: number;
}

interface UnitConverterProps {
  foodId: string;
}

export function UnitConverter({ foodId }: UnitConverterProps) {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchConversions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/cooking/conversions?foodId=${foodId}`
        );
        if (!response.ok) throw new Error('Failed to fetch conversions');
        const data = await response.json();
        setConversions(data);
      } catch (error) {
        addToast('Could not load conversions.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    void fetchConversions();
  }, [foodId, addToast]);

  const handleVote = async (
    conversionId: string,
    voteType: 'downvote' | 'upvote'
  ) => {
    try {
      const response = await fetch('/api/cooking/conversions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversionId, voteType }),
      });
      if (!response.ok) throw new Error('Failed to vote');
      // Optimistically update UI or refetch
      addToast('Vote submitted!', 'success');
    } catch (error) {
      addToast('Failed to submit vote.', 'error');
    }
  };

  const handleSuggest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      fromUnit: formData.get('fromUnit') as string,
      toUnit: 'g', // For now, only support converting to grams
      factor: Number(formData.get('factor')),
    };

    try {
      const response = await fetch('/api/cooking/conversions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId, ...data }),
      });
      if (!response.ok) throw new Error('Failed to suggest conversion');
      const newConversion = await response.json();
      setConversions([...conversions, newConversion]);
      setShowSuggestForm(false);
      addToast('Suggestion submitted!', 'success');
    } catch (error) {
      addToast('Failed to submit suggestion.', 'error');
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h4 className="font-semibold mb-2">User-Contributed Conversions</h4>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-2">
          {conversions.map((conv) => (
            <div key={conv.id} className="text-sm p-2 border rounded">
              1 {conv.fromUnit} = {conv.factor} {conv.toUnit}
              <div className="flex items-center gap-1 mt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void handleVote(conv.id, 'upvote');
                  }}
                >
                  👍 {conv.upvotes}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void handleVote(conv.id, 'downvote');
                  }}
                >
                  👎 {conv.downvotes}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Button
        onClick={() => {
          setShowSuggestForm(!showSuggestForm);
        }}
        variant="outline"
        className="mt-2"
      >
        {showSuggestForm ? 'Cancel' : 'Suggest Conversion'}
      </Button>
      {showSuggestForm && (
        <form
          onSubmit={(e) => {
            void handleSuggest(e);
          }}
          className="mt-2 space-y-2 border-t pt-2"
        >
          <input
            name="fromUnit"
            placeholder="e.g., 1 cup of flour"
            className="w-full p-1 border rounded"
          />
          <input
            type="number"
            name="factor"
            placeholder="equals how many grams?"
            className="w-full p-1 border rounded"
          />
          <Button type="submit">Submit</Button>
        </form>
      )}
    </div>
  );
}
