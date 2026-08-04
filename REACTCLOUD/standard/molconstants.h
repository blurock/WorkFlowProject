#define MOLECULE_PRINT_OUT_SUFFIX       "out"
#define MOL_FILE_LIST_SUFFIX            "lst"
#define SDF_FILE_LIST_SUFFIX            "sdf"
#define MOL_FILE_SUFFIX                 "mlf"

#define NUMBER_BOND_PARAMETERS 4
#define NUMBER_ATOM_PARAMETERS 12

#define HIGHEST_MULTIPLE_BOND 3
#define SINGLE                1

#define NUMBER_RXN_INFO          10
#define REACTANT_SYMMETRY                1
#define PRODUCT_SYMMETRY                 2
#define FORWARD_RELATIVE_RATE            3
#define FORWARD_A_CONSTANT               4
#define FORWARD_ACT_ENERGY               5
#define FORWARD_TEMP_CONSTANT            6
#define REVERSE_RELATIVE_RATE            7
#define REVERSE_A_CONSTANT               8
#define REVERSE_ACT_ENERGY               9
#define REVERSE_TEMP_CONSTANT            10


#define ATOMIC_NUMBER       0
#define NUMBER_ELECTRONS    1
#define NUMBER_SHELLS       2
#define CHARGE              3
#define ELECTRONEGATIVITY   4
#define COVALENT_RADIUS     5
#define RESONANT            6
#define BONDORDER           7
#define LONEPAIR            8
#define VALENCE             9
#define POLARIZABILITY     10

#define VALENCE_ATOMIC_NUMBER     0
#define VALENCE_STANDARD          1

#define VAL_SINGLE_BOND_COUNT  1     
#define VAL_DOUBLE_BOND_COUNT  10     
#define VAL_TRIPLE_BOND_COUNT  100     
#define VAL_CHARGE_SPEC        1000
#define VAL_AROMATIC_SPEC      10000
#define VAL_LONE_PAIR_COUNT    20000
#define VAL_HYDROGEN_COUNT     100000
#define VAL_ATOMIC_NUMBER      1000000
#define VAL_SINGLE             1
#define VAL_DOUBLE             2
#define VAL_TRIPLE             3
#define StandardChargeSpec(atominfo) ((INT) atominfo->Charge)

#define NUMBER_SDF_MOL_INFO       6
#define MOL_ID              0
#define MOL_NAME            1
#define INDEX_REFRACTION    2
#define MELTING_POINT       3
#define BOILING_POINT       4
#define PURE_OCTANE         5

#define META_ATOM_SET_KEYWORD         "MetaAtom"
#define META_ATOM_SET_KEYWORD_LENGTH  8
#define META_ATOM_KEYWORD             "Atom"
#define META_ATOM_KEYWORD_LENGTH      4

#define NUMBER_BOND_KEYWORDS    3
#define META_SINGLE      1
#define META_DOUBLE      2
#define META_TRIPLE      3
#define META_ATOM_OFFSET      200
#define MAX_NUMBER_OF_META_ATOMS  20
#define META_ATOM_FILE_SUFFIX "mta"

