
typedef union
#ifdef __cplusplus
	YYSTYPE
#endif
 	{
	int integer_value;
	float float_value;
        char *string_value;
	CommandInfo *command_info;
	} YYSTYPE;
extern YYSTYPE yylval;
# define END_OF_FILE 257
# define SPACE 258
# define CR 259
# define BASIC_NAME 260
# define TITLE 261
# define title_string 262
# define DEFAULT_STRING 263
# define COMMAND 264
# define FUNCTION 265
# define ENDCOMMAND 266
# define DONE 267
# define ARGUMENTS 268
# define END_ARGUMENTS 269
# define Y_Integer_Value 270
# define Y_Float_Value 271
# define INT_VALUE 272
# define FLOAT_VALUE 273
# define STRING_VALUE 274
# define INPUT_FILE_NAME 275
# define OUTPUT_FILE_NAME 276
# define LOWER 277
# define UPPER 278
# define DEFAULT 279
