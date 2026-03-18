import { Directive, ElementRef, EventEmitter, Output, inject } from '@angular/core';
import { DragDrop, DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';

@Directive({
    selector: '[appDraggableSignature]',
    standalone: true
})
export class DraggableSignatureDirective {
    private el = inject(ElementRef);

    @Output() dropped = new EventEmitter<{ x: number, y: number }>();

    // This directive will likely be used in conjunction with cdkDrag
    // But we want to calculate the % position relative to parent

    onDragEnd(event: any) {
        const element = this.el.nativeElement;
        const parent = element.parentElement;

        if (!parent) return;

        const parentRect = parent.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        // Calculate relative position in %
        const x = ((elementRect.left - parentRect.left) / parentRect.width) * 100;
        const y = ((elementRect.top - parentRect.top) / parentRect.height) * 100;

        this.dropped.emit({ x, y });
    }
}
