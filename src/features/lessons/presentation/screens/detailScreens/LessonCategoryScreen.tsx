import React, { useEffect, useState } from 'react';

import type { LessonCategoryRoute } from '../../../domain/lessonCategories';
import { lessonCategoryMap } from '../../../domain/lessonCategories';
import { getErrorMessage } from '../../../../../shared/lib/errors';
import type { LessonContent } from '../../../domain/types';
import { lessonUseCases } from '../../dependencies';
import LessonDetailTemplate from './LessonDetailTemplate';

type LessonCategoryScreenProps = {
  routeName: LessonCategoryRoute;
};

const LessonCategoryScreen = ({ routeName }: LessonCategoryScreenProps) => {
  const category = lessonCategoryMap[routeName];
  const [lessons, setLessons] = useState<LessonContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLessons = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await lessonUseCases.getLessonsByCategory(category.slug);

        if (!response.success) {
          throw new Error(response.error || 'Хичээлийн өгөгдөл ачаалах боломжгүй байна.');
        }

        if (isMounted) {
          setLessons(response.lessons || []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError, 'Хичээлийн өгөгдөл ачаалах үед алдаа гарлаа.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadLessons().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [category.slug]);

  return (
    <LessonDetailTemplate
      title={category.title}
      subtitle={category.subtitle}
      level={category.level}
      image={category.image}
      points={category.points}
      lessons={lessons}
      isLoading={isLoading}
      error={error}
    />
  );
};

export default LessonCategoryScreen;
