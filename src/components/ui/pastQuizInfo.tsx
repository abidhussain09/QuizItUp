// Legacy component - kept for reference
// The new home page uses an improved design

const data=[
    {
        quizName:"First Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2030",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Second Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2040",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Third Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2050",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Fourth Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2060",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Fifth Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2070",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Sixth Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2080",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"First Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2030",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Second Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2040",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Third Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2050",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Fourth Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2060",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Fifth Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2070",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Sixth Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2080",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"First Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2030",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Second Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2040",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Third Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2050",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Fourth Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2060",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Fifth Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2070",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Sixth Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2080",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"First Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2030",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Second Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2040",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Third Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2050",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Fourth Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2060",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Fifth Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2070",
        winner:"abid",
        noOfParicipant:"200"
    },
    {
        quizName:"Sixth Quiz",
        createdBy:"Abid hussain",
        quizDate:"19-11-2080",
        winner:"abid",
        noOfParicipant:"200"
    },
]
export default function PastQuizInfo(){
    return (
        <div className=" w-full h-96 border-2 border-solid border-neutral-400 rounded-2xl overflow-scroll overflow-x-hidden">
            <div className="flex gap-2 w-full px-4 pt-4 ">
                <div className="basis-1/5 text-xl bg-neutral-300 rounded-sm text-center">Quiz Name</div>
                <div className="basis-1/5 text-xl bg-neutral-300 rounded-sm text-center">Created By</div>
                <div className="text-xl basis-1/5 bg-neutral-300 rounded-sm text-center">Quiz Date</div>
                <div className="text-xl basis-1/5 bg-neutral-300 rounded-sm text-center">Winner of Quiz</div>
                <div className="text-xl basis-1/5 bg-neutral-300 rounded-sm text-center">Total Participants</div>
            </div>
            <div className="flex flex-col w-full p-4">
                {
                    data.map((ele,idx)=>{
                        return(
                            <div className="flex gap-2">
                            <div className="basis-1/5 text-xl text-center">{ele.quizName}</div>
                            <div className="basis-1/5 text-xl text-center">{ele.createdBy}</div>
                            <div className="basis-1/5 text-xl text-center">{ele.quizDate}</div>
                            <div className="basis-1/5 text-xl text-center">{ele.winner}</div>
                            <div className="basis-1/5 text-xl text-center">{ele.noOfParicipant}</div>
                        </div>
                        );
                    })
                }
            </div>
        </div>
    );
}