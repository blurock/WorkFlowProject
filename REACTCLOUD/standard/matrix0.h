#include "stats/matrix.h"

extern FLOAT *NthFullMatrixFLTElement(FullMatrixFLT *matrix,
				      INT i, INT j);
extern FullMatrixFLT *NormalizeColumns(FullMatrixFLT *matrix);
extern FullMatrixFLT *ReadInFullMatrixFLT(CommandReturn *comret,
					  FILE *file);
extern FullMatrixFLT *MatrixTransposeFLOAT(FullMatrixFLT *mat);
extern void PrintFullMatrixFLOAT(FullMatrixFLT *mat,
				 CHAR *title, CHAR *form);
extern FullMatrixFLT *MatrixMultFLT(INT id, CHAR *name,
				    FullMatrixFLT *mat1,
				    FullMatrixFLT *mat2);
extern FullMatrixFLT *ElementSquaredFLT(INT id, CHAR *name,
					FullMatrixFLT *mat1);
extern FullMatrixFLT *MatrixSubtractFLT(INT id, CHAR *name,
					FullMatrixFLT *mat1,
					FullMatrixFLT *mat2);
extern void MatrixMult(FullMatrixFLT *mat1,
		       FullMatrixFLT *mat2,
		       FullMatrixFLT *ans);
extern FullMatrixFLT *DiagonalFLTFromVector(INT id, CHAR *name,
					    FLOAT *vector, INT dimension);
extern FullMatrixFLT *MergeColumnsMatrixFLT(INT id, CHAR *name,
					    FullMatrixFLT *mat1,
					    FullMatrixFLT *mat2);
extern SymmetricEigenMath *EigenMatrix(INT id, CHAR *name, FullMatrixFLT *elements);
extern void ComputeEigenVector(SymmetricEigenMath *eigen);
extern FullMatrixFLT *MatrixInverseFLT(INT id, CHAR *name, FullMatrixFLT *orig);
extern void ComputeInverse(FullMatrixFLT *element, FullMatrixFLT *new);
extern void LUcompute(FLOAT *a, INT n, INT*index, FLOAT *d) ;
extern void jacobi(FLOAT *a, INT n,FLOAT *d,FLOAT *v,INT *nrot);
