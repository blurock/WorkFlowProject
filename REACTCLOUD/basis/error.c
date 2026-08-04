#include "basic.h"

void Error(type,message)
INT type;
CHAR *message;
{

      printf("\n%d:%s\n",type,message);
      if(type < 0) exit(1);
      return;
}



