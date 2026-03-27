import java.util.logging.Logger;

public class MinimalServerMain {
    private static final Logger logger = Logger.getLogger(MinimalServerMain.class.getName());

    public static void main(String[] args) {
        logger.info("MinimalServerMain started");
        try{
            Thread.sleep(Long.MAX_VALUE);
        } catch (InterruptedException e){
            e.printStackTrace();
        }
    }

}
