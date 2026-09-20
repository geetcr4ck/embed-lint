'use client';

// Ref: ARCHITECTURE.md §11 (renderer types), §15 (granular selectors).
// Preview dispatcher: one component per node type. Subscribes to the `type`
// field only so changing one node never re-renders the whole preview.

import { memo } from 'react';
import { useDocumentStore } from '@/lib/store/document';
import type { NodeId } from '@/lib/serializer/types';
import ActionRowPreview from './ActionRowPreview';
import ButtonPreview from './ButtonPreview';
import ContainerPreview from './ContainerPreview';
import MediaGalleryPreview from './MediaGalleryPreview';
import SectionPreview from './SectionPreview';
import SeparatorPreview from './SeparatorPreview';
import TextDisplayPreview from './TextDisplayPreview';
import ThumbnailPreview from './ThumbnailPreview';

function PreviewNodeInner({ id }: { id: NodeId }) {
  const type = useDocumentStore((s) => s.doc.nodes[id]?.type);

  switch (type) {
    case 17:
      return <ContainerPreview id={id} />;
    case 9:
      return <SectionPreview id={id} />;
    case 10:
      return <TextDisplayPreview id={id} />;
    case 2:
      return <ButtonPreview id={id} />;
    case 11:
      return <ThumbnailPreview id={id} />;
    case 12:
      return <MediaGalleryPreview id={id} />;
    case 14:
      return <SeparatorPreview id={id} />;
    case 1:
      return <ActionRowPreview id={id} />;
    default:
      return null;
  }
}

const PreviewNode = memo(PreviewNodeInner);
export default PreviewNode;
