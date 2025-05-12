import {
    DndContext,
    closestCenter,
    useSensor,
    useSensors,
    PointerSensor,
  } from "@dnd-kit/core";
  import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
  } from "@dnd-kit/sortable";
  import { CSS } from "@dnd-kit/utilities";
  import { Button } from "@/components/ui/button";
  import ClutchItem from "./ClutchItem";
  import { useState } from "react";
  import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
  
  // List of available options
  const options = ["Execute A", "Execute B", "Fight Mid", "First Blood Blue", "First Blood Red", "Denied Exec", "Planted", "Retake Failed", "Retake Success", "Save", "Rotate", "Rehit"];

  let counter = 0;

  const clutch = "Clutch";
  
  type DragAndDropListProps = {
    allowDuplicates: boolean;
    hasClutchItem: boolean;
  };

  type MidRoundItemProps = {
    id: string;
    label: string;
  };

  function ContainsKey(key: string, items: [string,string][]) {
    return items.find(x => x[1] == key) !== undefined
  }

  export default function DragAndDropList({ allowDuplicates, hasClutchItem }: DragAndDropListProps) {
    const [selectedItems, setSelectedItems] = useState<[string,string][]>([]);
    const [hasClutch, setClutch] = useState<boolean>(false);
  
    const sensors = useSensors(useSensor(PointerSensor));
  
    const handleDragEnd = (event: any) => {
      const { active, over } = event;
      if(active === null || over === null) return;
      if (active.id !== over.id) {
        const oldIndex = selectedItems.indexOf(active.id);
        const newIndex = selectedItems.indexOf(over.id);
        setSelectedItems(arrayMove(selectedItems, oldIndex, newIndex));
      }
    };
  
    const addItem = (item: string) => {
      if (allowDuplicates || selectedItems.find(x => x[1] == item) === undefined) {
        setSelectedItems([...selectedItems, [item + `-${counter++}`, item]]);
      }
    };

    const removeItem = (item: string) => {
      setSelectedItems(selectedItems.filter((i) => i[0] !== item));
    };
  
    function SortableItem({ id, label }: MidRoundItemProps) {
        const { attributes, listeners, setNodeRef, transform, transition } =
            useSortable({ id });
        
        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
        };
        
        return (
            <li
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="flex items-center justify-between p-2 border rounded bg-white"
            >
            {label}
            <Button variant="destructive" size="sm" onMouseDown={(e) => {e.preventDefault();e.stopPropagation();removeItem(id)}}>
                🗑
            </Button>
            </li>
        );
    }

    return (
      <div className="space-y-4">
        {/* All Options */}
        <div className="flex flex-wrap gap-2">
          {options.map((item) => (
            <Button
              key={item}
              variant={!allowDuplicates && ContainsKey(item, selectedItems) ? "secondary" : "outline"}
              disabled={!allowDuplicates && ContainsKey(item, selectedItems)}
              onClick={() => addItem(item)}
            >
              {item}
            </Button>
          ))}
          {/*Can only have one clutch in a round, must be last item */}
          { hasClutchItem && <Button 
            key={clutch}
            variant={ContainsKey(clutch, selectedItems) ? "secondary" : "outline"}
              disabled={ContainsKey(clutch, selectedItems)}
              onClick={() => setClutch(true)}
            >
              {clutch}
            </Button>}
        </div>
  
        {/* Drag and Drop List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={selectedItems.map(x => x[0])}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {selectedItems.map((item) => (
                <SortableItem key={item[0]} id={item[0]} label={item[1]} />
              ))}
              {hasClutch && <ClutchItem />}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
    );
  }
  