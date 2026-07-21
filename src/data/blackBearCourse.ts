export type CourseHole = {
  holeNumber: number;
  par: number;
  strokeIndex: number;
};

export const blackBearCourse: CourseHole[] = [
  { holeNumber: 1, par: 4, strokeIndex: 5 },
  { holeNumber: 2, par: 5, strokeIndex: 17 },
  { holeNumber: 3, par: 3, strokeIndex: 15 },
  { holeNumber: 4, par: 5, strokeIndex: 11 },
  { holeNumber: 5, par: 3, strokeIndex: 9 },
  { holeNumber: 6, par: 4, strokeIndex: 1 },
  { holeNumber: 7, par: 4, strokeIndex: 7 },
  { holeNumber: 8, par: 4, strokeIndex: 13 },
  { holeNumber: 9, par: 4, strokeIndex: 3 },
  { holeNumber: 10, par: 4, strokeIndex: 10 },
  { holeNumber: 11, par: 3, strokeIndex: 12 },
  { holeNumber: 12, par: 4, strokeIndex: 2 },
  { holeNumber: 13, par: 4, strokeIndex: 6 },
  { holeNumber: 14, par: 5, strokeIndex: 14 },
  { holeNumber: 15, par: 3, strokeIndex: 18 },
  { holeNumber: 16, par: 5, strokeIndex: 16 },
  { holeNumber: 17, par: 4, strokeIndex: 4 },
  { holeNumber: 18, par: 4, strokeIndex: 8 }
];

export function getBlackBearHole(
  holeNumber: number
): CourseHole {
  const hole = blackBearCourse.find(
    (candidate) =>
      candidate.holeNumber === holeNumber
  );

  if (!hole) {
    throw new Error(
      `Black Bear hole ${holeNumber} could not be found.`
    );
  }

  return hole;
}